from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO
import requests
import os
import json

app = Flask(__name__)
CORS(app)

base_dir = os.path.dirname(__file__)

""" 
TARGET_SNPS contains relevant SNPs (single nucleotide polymorphisms) that impact our pathway of interest.
* Add entries to this JSON when adding new SNPs.
* Each entry includes the SNP ID, associated gene (node), a description of its biological or clinical significance, and its position in the pathway.
"""
snps_path = os.path.join(base_dir, 'jsons', 'target_snps.json')
with open(snps_path, encoding="utf-8") as f:
    TARGET_SNPS = json.load(f)

""" 
TARGET_MEDS contains drug recommendations categorized by the gene they target.
* Add entries to this JSON when adding new drug-gene relationships.
* Each entry includes the recommended drug, a rationale for its use, alternative treatment options, and supporting citations.
"""
meds_path = os.path.join(base_dir, 'jsons', 'medications.json')
with open(meds_path, encoding="utf-8") as f:
    TARGET_MEDS = json.load(f)

""" 
DRUG_OPTIONS provides drug or treatment options along with backup informational links.
* Add entries to this JSON when including new drug or treatment options.
* Each entry includes the drug name and a link to additional information about the drug.
"""
drugs_path = os.path.join(base_dir, 'jsons', 'drug_options.json')
with open(drugs_path, encoding="utf-8") as f:
    DRUG_OPTIONS = json.load(f)

""" 
METADATA_QUESTIONS contains a list of user-specific conditions and the drugs that should be avoided if the condition is met.
* Each entry has a 'condition' field with key-value pairs representing metadata (e.g., pregnancy status, age, IBD type and severity).
* If a user's metadata matches the condition, the corresponding drugs in 'banned_drugs' should be excluded from consideration.
* Add new entries to this JSON when introducing new conditions or drug restrictions.
* Note: The frontend must also be updated to reflect changes to this structure.
"""
metadata_path = os.path.join(base_dir, 'jsons', 'metadata_questions.json')
with open(metadata_path, encoding="utf-8") as f:
    METADATA_QUESTIONS = json.load(f)

def parse_23andme_file(file_stream):
    """
    Parses a 23andMe raw data file to identify SNPs that match entries in TARGET_SNPS.

    :param file_stream: File stream of the user's 23andMe file (expected tab-delimited format).
    :return: A dictionary of matched SNPs, where each entry includes:
             - node: associated gene or pathway node
             - description: explanation of SNP relevance
             - level: position in the biological pathway (lower = higher priority)
             - link: source or reference link
             - genotype: user's specific genotype for the SNP
    """
    found = {}
    for line in file_stream:
        decoded = line.decode('utf-8').strip()
        if decoded.startswith('#'):
            continue
        parts = decoded.split('\t')
        if len(parts) < 4:
            continue
        rsid, chromosome, position, genotype = parts[:4]
        TARGET_SNP_LOOKUP = {entry['snp']: entry for entry in TARGET_SNPS}
        if rsid in TARGET_SNP_LOOKUP:
            entry = TARGET_SNP_LOOKUP[rsid]
            print(genotype)
            print(entry['bases'])
            print(genotype in entry['bases'])
            # if genotype in TARGET_SNP_LOOKUP[rsid]['bases']:
            found[rsid] = {
                'node': entry['node'],
                'description': entry['description'],
                'level': entry['level'],
                'link': entry['link'],
                'genotype': genotype
            }
    return found

def check_pathway(snps):
    """
    Identifies the most critical SNPs (highest priority = lowest pathway level) and retrieves drug recommendations for those genes.

    :param snps: Dictionary of matched SNPs from parse_23andme_file().
    :return: A dictionary of genes at the top priority level, with:
             - snps: matching SNPs with genotype, description, and link
             - best_drug: recommended drug(s) for the gene
             - alternatives: alternative drug(s)
             - description: rationale for recommendation
             - citation: supporting scientific references
    """
    levels = [info['level'] for info in snps.values()]
    if not levels:
        return {}

    best_level = min(levels)

    top_snps = {snp: info for snp, info in snps.items() if info['level'] == best_level}

    result = {}
    for snp, info in top_snps.items():
        node = info['node']
        description = info['description']
        link = info['link']
        genotype = info['genotype']
        if node not in result:
            result[node] = {
                'snps': {},
                'best_drug': TARGET_MEDS.get(node, {}).get('best_drug', []),
                'alternatives': TARGET_MEDS.get(node, {}).get('alternatives', []),
                'description': TARGET_MEDS.get(node, {}).get('description', ''),
                'citation': TARGET_MEDS.get(node, {}).get('citation', [])
            }
        result[node]['snps'][snp] = {
            'description': description,
            'link': link,
            'genotype': genotype
        }

    return result

def extract_valid_meds(pathway_output, accepted_drugs):
    """
    Filters recommended and alternative drugs to include only those safe for the patient based on their metadata.

    :param pathway_output: Output from check_pathway() containing genes, drugs, and SNPs.
    :param accepted_drugs: List of drugs deemed safe based on patient metadata.
    :return: Dictionary with two lists:
             - valid_best_drugs: recommended drugs that are safe
             - valid_alternatives: safe alternatives not already in valid_best_drugs
    """
    best_drugs = set()
    alternatives = set()

    for gene_info in pathway_output.values():
        best_drugs.update(gene_info.get("best_drug", []))
        alternatives.update(gene_info.get("alternatives", []))

    valid_best = [drug for drug in best_drugs if drug in accepted_drugs]
    valid_alternatives = [
        drug for drug in alternatives
        if drug in accepted_drugs and drug not in valid_best
    ]

    return {
        "valid_best_drugs": valid_best,
        "valid_alternatives": valid_alternatives
    }

def get_med_info(drug_name):
    """
    Retrieves drug safety and usage information from the FDA API based on a drug name.

    :param drug_name: The name of the drug (string).
    :return: Dictionary containing FDA drug information including:
             - Brand Name
             - Active Ingredients
             - Dosage Form
             - Route
             - Prescription Status
             - Indications and Usage
             - Adverse Reactions
             - Warnings
             - Boxed Warning
             - Dosage and Administration
             - Backup Link (fallback resource if FDA data is incomplete)
    """
    drug_name_upper = drug_name.upper()

    drugsfda_url = 'https://api.fda.gov/drug/drugsfda.json'
    drugsfda_params = {
        'search': f'products.brand_name:"{drug_name_upper}"',
        'limit': 1
    }
    drugsfda_resp = requests.get(drugsfda_url, params=drugsfda_params)

    label_url = 'https://api.fda.gov/drug/label.json'
    label_params = {
        'search': f'openfda.brand_name:"{drug_name_upper}"',
        'limit': 1
    }
    label_resp = requests.get(label_url, params=label_params)

    info = {}

    # product info
    if drugsfda_resp.ok:
        try:
            product = drugsfda_resp.json()['results'][0]['products'][0]
            info['Brand Name'] = product.get('brand_name')
            info['Active Ingredients'] = [
                f"{ing['name']} ({ing['strength']})" for ing in product.get('active_ingredients', [])
            ]
            info['Dosage Form'] = product.get('dosage_form')
            info['Route'] = product.get('route')
            info['Prescription Status'] = product.get('marketing_status')
        except Exception as e:
            info['Product Info Error'] = f"Could not parse drugsfda data: {e}"
    else:
        info['Product Info Error'] = f"Failed to fetch drugsfda data ({drugsfda_resp.status_code})"

    # label info
    if label_resp.ok:
        try:
            label = label_resp.json()['results'][0]
            info['Indications and Usage'] = label.get('indications_and_usage', ['Not listed'])[0]
            info['Adverse Reactions'] = label.get('adverse_reactions', ['Not listed'])[0]
            info['Warnings'] = label.get('warnings', ['Not listed'])[0]
            info['Boxed Warning'] = label.get('boxed_warning', ['None'])[0]
            info['Dosage and Administration'] = label.get('dosage_and_administration', ['Not listed'])[0]
        except Exception as e:
            info['Label Info Error'] = f"Could not parse label data: {e}"
    else:
        info['Brand Name'] = drug_name_upper
        info['Label Info Error'] = f"Failed to fetch label data ({label_resp.status_code})"

    backup_link = DRUG_OPTIONS.get(drug_name)
    info['Backup Link'] = backup_link

    return info

def parse_metadata(form_data):
    """
    Parses user metadata and determines the list of allowed drugs based on input conditions.

    This function takes form data submitted by the user and evaluates it against a set of 
    predefined medical conditions and drug restrictions (from METADATA_QUESTIONS). It filters 
    out drugs that are:
    - Already taken by the user,
    - Banned due to the user's age, medical conditions, or other metadata,
    - Not allowed based on the user's preferred route of administration.

    :param form_data: A dictionary containing user-submitted form fields, including:
                      - 'age'
                      - 'pregnant'
                      - 'kidneys'
                      - 'IBD'
                      - 'severity'
                      - 'firstTreatment'
                      - 'route'
                      - 'drugs' (JSON string list of drugs already taken)

    :return: A list of drug names (strings) that are allowed for the user based on the provided metadata.
    """
    drugs_json = form_data.get('drugs')
    drugs = json.loads(drugs_json)
    drugs_taken = set(entry['drug'] for entry in drugs)

    banned_drugs = set()

    rules = METADATA_QUESTIONS
    for rule in rules:
        cond = rule["condition"]

        match = True
        for key, val in cond.items():
            if key == "age_gt65":
                age_str = form_data.get("age", "")
                if not age_str.isdigit() or int(age_str) <= val:
                    match = False
                    break
            elif key == "age_lt16":
                age_str = form_data.get("age", "")
                if not age_str.isdigit() or int(age_str) >= val:
                    match = False
                    break
            elif key == "age_lt6":
                age_str = form_data.get("age", "")
                if not age_str.isdigit() or int(age_str) >= val:
                    match = False
                    break
            else:
                user_val = form_data.get(key, "").strip()
                if not user_val:
                    match = False
                    break
                if user_val.lower() != val.lower():
                    match = False
                    break

        if match:
            banned_drugs.update(rule["banned_drugs"])

    routes_map = {
        "oral_only": ["Imuran", "Purinethol"],
        "iv_only": ["Entyvio", "Remicade"],
        "injection_only": ["Entyvio", "Humira", "Otrexup", "Simponi"]
    }

    master_drugs_list = set([drug for drug in DRUG_OPTIONS if drug != "None known"])

    route = form_data.get("route", "").lower()
    if route in routes_map:
        allowed_drugs_by_route = set(routes_map[route])
    else:
        allowed_drugs_by_route = master_drugs_list

    allowed = allowed_drugs_by_route - banned_drugs - drugs_taken
    return list(allowed)

@app.route('/api/drug-options')
def get_drug_options():
    """
    Provides a list of available drug options to the frontend.

    This allows users to indicate if they have taken any of these medications.

    :return: JSON list of drug names, excluding the placeholder "None known".
    """
    new_drugs = [drug for drug in DRUG_OPTIONS if drug != "None known"]
    return jsonify(new_drugs)

@app.route('/upload', methods=['POST'])
def upload_file():
    """
    Handles 23andMe file uploads and form data from the frontend to analyze SNPs and recommend treatments.

    Workflow:
    - Extracts form data and user metadata.
    - Reads the uploaded 23andMe raw data file.
    - Matches user's SNPs against known targets.
    - Determines highest priority pathway genes and related drug options.
    - Filters drug recommendations based on patient metadata.
    - Retrieves detailed drug info from the FDA API.
    - Returns a JSON response containing SNP info, drug recommendations, descriptions, and citations.

    :return: JSON with keys:
             - message: upload status
             - genes_and_snps: matched SNPs by gene/node
             - best_drug: detailed info on recommended drugs
             - alternatives: detailed info on alternative drugs
             - best_drug_description: rationale for best drug per gene
             - citations: supporting scientific references for recommendations
    """
    # Extract form data from frontend
    form_data = request.form.to_dict()
    print("Form Data:", form_data)

    # Get list of acceptable drugs from metadata
    print("Metadata Results:")
    metadata = parse_metadata(form_data)
    print(metadata)
    print("")

    # Make sure file is uploaded
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file uploaded'}), 400

    # Get matched SNPs from 23andMe file
    file_stream = BytesIO(file.read())
    matched_snps = parse_23andme_file(file_stream.readlines())
    print("Matched SNPs:")
    print(matched_snps)
    print("")

    # Get highlest level of the pathway and match meds
    path = check_pathway(matched_snps)
    print("Highest Pathway and Matched Meds:")
    print(path)
    print("")

    # Get accepted drugs based on 23andMe data and metadata results
    accepted = extract_valid_meds(path, metadata)
    print("Accepted drugs:")
    print(accepted)
    print("")

    # Separate valid best drugs and valid alternative drugs
    valid_best_drugs = accepted['valid_best_drugs']
    valid_alternatives = accepted['valid_alternatives']

    # Get med info from API (bestS and alternatives)
    meds_best = [get_med_info(name) for name in valid_best_drugs]
    meds_alt = [get_med_info(name) for name in valid_alternatives]

    # Return relevant info to frontend via a json
    if path == {}:
        response_data = {
            'message': f'File {file.filename} uploaded and processed!',
            'genes_and_snps': {},
            'best_drug': [],
            'alternatives': [],
            'best_drug_description': {},
            'citations': []
        }
        print("hi")
        print(response_data)
        return jsonify(response_data)
    else:
        response_data = {
        'message': f'File {file.filename} uploaded and processed!',
        'genes_and_snps': {
            node: data['snps']
            for node, data in path.items()
        },
        'best_drug': meds_best, 
        'alternatives': meds_alt,
        'best_drug_description': [
            {
                'node': node,
                'drug': path[node]['best_drug'],
                'description': path[node]['description']
            }
            for node in path
            if any(drug in valid_best_drugs for drug in path[node]['best_drug'])
        ],
        'citations': [{'best_drug': path[node]['best_drug'], 'citation': path[node]['citation']} for node in path]
        }
        return jsonify(response_data)

if __name__ == '__main__':
    app.run(debug=True)
