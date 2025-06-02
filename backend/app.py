from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO
import requests
import pandas as pd
import os
import json

app = Flask(__name__)
CORS(app)

base_dir = os.path.dirname(__file__)

""" 
TARGET SNPS are the relevant SNPs we are looking for (SNPs that affect our pathway)
* Add to this json if adding to the SNPs we are looking for
* This json includes the SNP, node (gene), description for what it means if you have this SNP, and the SNP's level in the pathway
"""
snps_path = os.path.join(base_dir, 'jsons', 'target_snps.json')
with open(snps_path, encoding="utf-8") as f:
    TARGET_SNPS = json.load(f)

""" 
TARGET_MEDS are the drug options categorized by which gene they affect
* Add to this json if adding meds to genes
* This json includes the best drug, a description for why this is the best drug, alternative drugs, and citations
"""
meds_path = os.path.join(base_dir, 'jsons', 'medications.json')
with open(meds_path, encoding="utf-8") as f:
    TARGET_MEDS = json.load(f)

""" 
DRUG_OPTIONS are the drug options with backup links
* Add to this json if adding drug/treatment options
* This json includes drug name and backup link to drug info
"""
drugs_path = os.path.join(base_dir, 'jsons', 'drug_options.json')
with open(drugs_path, encoding="utf-8") as f:
    DRUG_OPTIONS = json.load(f)

""" 
METADATA_QUESTIONS are the metadata questions with a list of drugs the user cannot take if the asnwer is yes
* Add to this json if adding metadata questions
* This json includes question and drugs user cannot take
* must also update frontend
"""
metadata_path = os.path.join(base_dir, 'jsons', 'metadata_questions.json')
with open(metadata_path, encoding="utf-8") as f:
    METADATA_QUESTIONS = json.load(f)

def parse_23andme_file(file_stream):
    """
    parse_23andme_file searches through the 23andMe file and matches any SNPs in the TARGET_SNPS list

    :param file_stream: takes in a file stream of the 23andMe file
    :return: returns a json that includes node (gene), description (what this SNP means), and level (level in the pathway) for each SNP
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
            if genotype in TARGET_SNP_LOOKUP[rsid]['bases']:
                found[rsid] = {
                    'node': entry['node'],
                    'description': entry['description'],
                    'level': entry['level'],
                }
    return found

def check_pathway(snps):
    """
    check_pathway takes the matched SNPs from the 23andMe file and returns the SNPs at the highest level of the pathway (where highest is 1)

    :param snps: takes in json of found SNPs from 23andMe file, including node, description, and level
    :return: returns a json that includes SNPs, best drug option, alternative drugs, descirption for why this drug is the best, and citations for each gene at the highest level
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
        if node not in result:
            result[node] = {
                'snps': {},
                'best_drug': TARGET_MEDS.get(node, {}).get('best_drug', []),
                'alternatives': TARGET_MEDS.get(node, {}).get('alternatives', []),
                'description': TARGET_MEDS.get(node, {}).get('description', ''),
                'citation': TARGET_MEDS.get(node, {}).get('citation', [])
            }
        result[node]['snps'][snp] = description

    return result

def extract_valid_meds(pathway_output, accepted_drugs):
    """
    extract_valid_meds takes in the matched genes and related info (snps, best drug, alternatives, description, citation) and the accepted drugs from the patient metadata to return drugs that are safe for the patient to take

    :pathway_output: takes in json of matched genes and related info (snps, best drug, alternatives, description, citation)
    :accepted_drugs: takes in list of accepted drugs from metadata function (drugs that are safe for patient to take based on form questions)
    :return: returns a json of two lists, one of the valid best drugs and one of the valid alternative drugs (valid meaning safe for patient to take based on metadata)
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
    get_med_info takes in a drug name (string) and connects to fda.gov/drugs API to give drug information to the frontend

    :drug_name: takes in drug name (string)
    :return: returns a json of drug information pulled from fda.gov/drugs API
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
    drugs_json = form_data.get('drugs')
    drugs = json.loads(drugs_json)
    drugs_taken = set(entry['drug'] for entry in drugs)

    banned_drugs = set()

    rules = METADATA_QUESTIONS
    for rule in rules:
        cond = rule["condition"]

        match = True
        for key, val in cond.items():
            if key == "age_gt":
                age_str = form_data.get("age", "")
                if not age_str.isdigit() or int(age_str) <= val:
                    match = False
                    break
            elif key == "age_lt":
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
    get_drug_options() sends the drug options to the frontend so users can report whether they have taken any of the medications

    :return: returns a json of the drugs
    """
    new_drugs = [drug for drug in DRUG_OPTIONS if drug != "None known"]
    return jsonify(new_drugs)

@app.route('/upload', methods=['POST'])
def upload_file():
    """
    upload_file() is the main function from the frontend that takes in a 23andMe file as well as form data and calls the above functions to determine the best treatment for users

    :return: returns a json of snps and their causes, best drug and description, alternative drugs, and citations
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
        'best_drug_description': [{'node': node, 'drug':path[node]['best_drug'], 'description': path[node]['description']} for node in path],
        'citations': [{'best_drug': path[node]['best_drug'], 'citation': path[node]['citation']} for node in path]
        }
        return jsonify(response_data)

if __name__ == '__main__':
    app.run(debug=True)
