from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import json

from patient_context import (
    EXPECTED_PIPELINE_FIELDS,
    merge_pipeline_form_data,
    normalize_supabase_context_to_form_data,
)
from supabase_client import (
    fetch_check_in,
    fetch_check_in_medications,
    fetch_profile,
    fetch_symptoms,
    insert_recommendation,
    supabase_is_configured,
)

app = Flask(__name__)
CORS(app)

base_dir = os.path.dirname(__file__)

# ADD TO THIS LIST IF ADDING A PATHWAY
""" 
each path in this list is a JSON that contains relevant SNPs (single nucleotide polymorphisms) that impact our pathway of interest.
* Add entries to this JSON when adding new SNPs.
* Each entry includes the SNP ID, associated gene (node), a description of its biological or clinical significance, and its position in the pathway.
"""
PATHWAY_FILES = [
    os.path.join(base_dir, 'jsons', 'pathway1_target_snps.json'),
]

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

def parse_23andme_file(file_stream, pathway_snps):
    """
    Parses a 23andMe raw data file to identify SNPs that match entries in a specified pathway SNP list,
    filtering by both rsid and genotype.

    :param file_stream: File stream of the user's 23andMe raw data file, expected to be tab-delimited.
                        Each line should contain at least four columns: rsid, chromosome, position, genotype.
    :param pathway_snps: A list of dictionaries defining SNPs of interest for a particular biological pathway.
                         Each dictionary must include keys: 'snp', 'node', 'description', 'level', 'link', and 'bases'.
                         The 'bases' field defines a list of genotypes (e.g., ['AA', 'AG']) that are considered matches.

    :return: A dictionary mapping matched SNP rsids to detailed information including:
             - node: associated gene or pathway node
             - description: explanation of the SNP's biological relevance within the pathway
             - level: importance or position within the biological pathway (lower number indicates higher priority)
             - link: reference URL or source for the SNP data
             - genotype: the user's genotype for the SNP from the 23andMe data file

    This function is designed to be flexible, allowing analysis of any SNP pathway by providing
    a custom list of pathway SNPs. Only SNPs whose rsid and genotype match the criteria in the
    pathway SNP list will be included in the output, making it easy to adapt for new or different
    biological pathways simply by supplying a different SNP JSON list.
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
        TARGET_SNP_LOOKUP = {entry['snp']: entry for entry in pathway_snps}
        if rsid in TARGET_SNP_LOOKUP:
            entry = TARGET_SNP_LOOKUP[rsid]
            if genotype in TARGET_SNP_LOOKUP[rsid]['bases']:
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


def build_recommendation_response(file_name, form_data, file_stream):
    """
    Runs the existing genetics and metadata pipeline and returns the legacy response payload.

    :param file_name: Original uploaded filename.
    :param form_data: Normalized form data matching the legacy frontend contract.
    :param file_stream: Iterable of uploaded file lines.
    :return: Recommendation payload previously returned by /upload.
    """
    normalized_form_data = dict(form_data)
    normalized_form_data.setdefault("drugs", "[]")

    # Get list of acceptable drugs from metadata
    metadata = parse_metadata(normalized_form_data)

    path = {}

    # Goes through each pathway to look for relevant SNPs to match with meds
    for my_path in PATHWAY_FILES:
        with open(my_path, encoding="utf-8") as f:
            pathway_snps = json.load(f)

        # Get matched SNPs from 23andMe file
        matched_snps = parse_23andme_file(file_stream, pathway_snps)
        # Get highest level of the pathway and match meds
        result = check_pathway(matched_snps)

        # Merge all relevant highest level SNPs for each pathway
        for gene, data in result.items():
            if gene not in path:
                path[gene] = data
            else:
                # Merge SNPs and avoid duplication
                path[gene]['snps'].update(data.get('snps', {}))
                path[gene]['best_drug'] = list(set(path[gene]['best_drug']) | set(data.get('best_drug', [])))
                path[gene]['alternatives'] = list(set(path[gene]['alternatives']) | set(data.get('alternatives', [])))
                path[gene]['citation'] = list(set(path[gene]['citation']) | set(data.get('citation', [])))

    # Get accepted drugs based on 23andMe data and metadata results
    accepted = extract_valid_meds(path, metadata)

    # Separate valid best drugs and valid alternative drugs
    valid_best_drugs = accepted['valid_best_drugs']
    valid_alternatives = accepted['valid_alternatives']

    # Get med info from API (best and alternatives)
    meds_best = [get_med_info(name) for name in valid_best_drugs]
    meds_alt = [get_med_info(name) for name in valid_alternatives]

    filtered_out_drugs = sorted(
        {
            drug
            for gene_data in path.values()
            for drug in (gene_data.get("best_drug", []) + gene_data.get("alternatives", []))
            if drug
            and drug.lower() != "none known"
            and drug not in valid_best_drugs
            and drug not in valid_alternatives
        }
    )

    # Return relevant info to frontend via json
    if path == {}:
        response_data = {
            "message": f"File {file_name} uploaded and processed!",
            "genes_and_snps": {},
            "best_drug": [],
            "alternatives": [],
            "best_drug_description": {},
            "citations": []
        }
        return response_data, {
            "path": path,
            "valid_best_drugs": valid_best_drugs,
            "valid_alternatives": valid_alternatives,
            "filtered_out_drugs": filtered_out_drugs,
        }

    best_drug_description = [
            {
                'node': node,
                'drug': path[node]['best_drug'],
                'description': path[node]['description']
            }
            for node in path
            if (
                any(drug in valid_best_drugs for drug in path[node]['best_drug'])
                or any(drug.lower() == "none known" for drug in path[node]['best_drug'])
            )
        ]

    response_data = {
        'message': f'File {file_name} uploaded and processed!',
        'genes_and_snps': {
            node: data['snps']
            for node, data in path.items()
        },
        'best_drug': meds_best,
        'alternatives': meds_alt,
        'best_drug_description': best_drug_description,
        'citations': [{'best_drug': path[node]['best_drug'], 'citation': path[node]['citation']} for node in path]
    }
    return response_data, {
        "path": path,
        "valid_best_drugs": valid_best_drugs,
        "valid_alternatives": valid_alternatives,
        "filtered_out_drugs": filtered_out_drugs,
    }


def extract_brand_names(drug_records):
    names = []
    for record in drug_records or []:
        if not isinstance(record, dict):
            continue
        brand_name = record.get("Brand Name")
        if brand_name:
            names.append(brand_name)
    return names


def build_shared_recommendation_row(response_data, analysis_context):
    path = analysis_context.get("path", {})
    valid_best_drugs = analysis_context.get("valid_best_drugs", [])
    filtered_out_drugs = analysis_context.get("filtered_out_drugs", [])

    description_entries = response_data.get("best_drug_description") or []
    top_gene = ""
    description = ""
    top_score = 0

    if description_entries:
        top_gene = description_entries[0].get("node") or ""
        description = description_entries[0].get("description") or ""
    elif response_data.get("genes_and_snps"):
        top_gene = next(iter(response_data["genes_and_snps"]), "")

    if top_gene:
        top_score = len((response_data.get("genes_and_snps") or {}).get(top_gene, {}))
        if not description and path.get(top_gene):
            description = path[top_gene].get("description", "")

    if not top_gene and path:
        top_gene = next(iter(path), "")
        top_score = len(path[top_gene].get("snps", {}))
        description = path[top_gene].get("description", "")

    best_drugs = extract_brand_names(response_data.get("best_drug", []))
    alternatives = extract_brand_names(response_data.get("alternatives", []))

    if not best_drugs and valid_best_drugs:
        best_drugs = valid_best_drugs

    return {
        "top_gene": top_gene,
        "top_score": top_score,
        "best_drugs": best_drugs,
        "alternatives": alternatives,
        "description": description,
        "filtered_out_drugs": filtered_out_drugs,
    }


def build_form_data_from_supabase(profile_id=None, check_in_id=None):
    """
    Fetches shared patient context from Supabase and maps it to the legacy pipeline contract.

    :param profile_id: Shared profile identifier.
    :param check_in_id: Shared check-in identifier.
    :return: Tuple of (normalized_form_data, debug_context).
    """
    if not supabase_is_configured():
        raise RuntimeError(
            "Supabase IDs were provided but the backend is not configured for Supabase."
        )

    check_in = fetch_check_in(profile_id=profile_id, check_in_id=check_in_id)
    if check_in_id and not check_in:
        raise ValueError(f"Could not find check-in {check_in_id} in Supabase.")

    resolved_profile_id = profile_id

    if check_in and not resolved_profile_id:
        resolved_profile_id = (
            check_in.get("profile_id")
            or check_in.get("user_id")
        )

    profile = fetch_profile(resolved_profile_id) if resolved_profile_id else None
    if profile_id and not profile:
        raise ValueError(f"Could not find profile {profile_id} in Supabase.")

    symptoms = fetch_symptoms(check_in.get("id")) if check_in else []
    medications = fetch_check_in_medications(check_in.get("id")) if check_in else []

    normalized_form_data = normalize_supabase_context_to_form_data(
        profile,
        check_in,
        symptoms,
        medications,
    )

    return normalized_form_data, {
        "profile": profile,
        "check_in": check_in,
        "symptoms": symptoms,
        "medications": medications,
        "profile_id": profile.get("id") if profile else resolved_profile_id,
        "check_in_id": check_in.get("id") if check_in else check_in_id,
    }


def run_recommendation_pipeline(uploaded_file, request_form_data=None, profile_id=None, check_in_id=None):
    """
    Shared orchestration entrypoint for legacy uploads and shared Supabase-backed runs.

    :param uploaded_file: Werkzeug uploaded file object.
    :param request_form_data: Raw form values from the request.
    :param profile_id: Optional shared profile identifier.
    :param check_in_id: Optional shared check-in identifier.
    :return: Recommendation payload with extra debug IDs when available.
    """
    if not uploaded_file:
        raise ValueError("No file uploaded")

    request_form_data = request_form_data or {}
    for field in EXPECTED_PIPELINE_FIELDS:
        request_form_data.setdefault(field, "")

    context_source = "form_upload"
    debug_context = {
        "profile_id": profile_id,
        "check_in_id": check_in_id,
    }

    if profile_id or check_in_id:
        supabase_form_data, debug_context = build_form_data_from_supabase(
            profile_id=profile_id,
            check_in_id=check_in_id,
        )
        effective_form_data = merge_pipeline_form_data(
            supabase_form_data,
            request_form_data,
        )
        context_source = "supabase"
    else:
        effective_form_data = merge_pipeline_form_data({}, request_form_data)

    file_stream = uploaded_file.stream.readlines()
    response_data, analysis_context = build_recommendation_response(
        uploaded_file.filename,
        effective_form_data,
        file_stream,
    )

    recommendation_id = None
    if debug_context.get("profile_id") or debug_context.get("check_in_id"):
        shared_recommendation_row = build_shared_recommendation_row(
            response_data,
            analysis_context,
        )
        inserted_row = insert_recommendation(
            profile=debug_context.get("profile"),
            profile_id=debug_context.get("profile_id"),
            check_in_id=debug_context.get("check_in_id"),
            top_gene=shared_recommendation_row["top_gene"],
            top_score=shared_recommendation_row["top_score"],
            best_drugs=shared_recommendation_row["best_drugs"],
            alternatives=shared_recommendation_row["alternatives"],
            description=shared_recommendation_row["description"],
            filtered_out_drugs=shared_recommendation_row["filtered_out_drugs"],
            debug_payload={
                "source": "virgil_1_0",
                "file_name": uploaded_file.filename,
                "inputs": effective_form_data,
                "outputs": response_data,
                "shared_recommendation_row": shared_recommendation_row,
            },
        )
        recommendation_id = inserted_row.get("id") if inserted_row else None

    response_data.update(
        {
            "context_source": context_source,
            "profile_id": debug_context.get("profile_id"),
            "check_in_id": debug_context.get("check_in_id"),
            "recommendation_id": recommendation_id,
        }
    )
    return response_data


def handle_recommendation_request():
    form_data = request.form.to_dict()
    profile_id = form_data.get("profile_id") or None
    check_in_id = form_data.get("check_in_id") or None

    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file uploaded'}), 400

    try:
        response_data = run_recommendation_pipeline(
            file,
            request_form_data=form_data,
            profile_id=profile_id,
            check_in_id=check_in_id,
        )
        return jsonify(response_data)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    except Exception as error:
        return jsonify({"error": str(error)}), 500

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
    Legacy upload endpoint. Still accepts the original form contract and can now optionally
    accept profile_id or check_in_id to enrich the pipeline from shared Supabase patient data.
    """
    return handle_recommendation_request()


@app.route('/api/recommendations/run', methods=['POST'])
def run_recommendation():
    """
    Shared API endpoint for running the genetics pipeline against a 23andMe upload and optional
    Supabase-backed patient context identified by profile_id or check_in_id.
    """
    return handle_recommendation_request()

if __name__ == '__main__':
    app.run(debug=True)
