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
with open(snps_path, 'r') as f:
    TARGET_SNPS = json.load(f)

""" 
TARGET_MEDS are the drug options categorized by which gene they affect
* Add to this json if adding meds to genes
* This json includes the best drug, a description for why this is the best drug, alternative drugs, and citations
"""
meds_path = os.path.join(base_dir, 'jsons', 'medications.json')
with open(meds_path, 'r') as f:
    TARGET_MEDS = json.load(f)

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
    valid_alternatives = [drug for drug in alternatives if drug in accepted_drugs]

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
        info['Label Info Error'] = f"Failed to fetch label data ({label_resp.status_code})"

    return info

def parse_metadata(answers, drugs_taken):
   questions= {
    "Are you pregnant or planning to become pregnant?": [
        "Tofacitinib",
        "Etrasimod",
        "Ozanimod",
        "Risankizumab",
        "Upadacitinib",
        "Filgotinib",
        "Methotrexate"
    ],
    "Are you breast feeding?": [
        "Tofacitinib",
        "Etrasimod",
        "Ozanimod",
        "Risankizumab",
        "Upadacitinib",
        "Filgotinib",
        "Methotrexate"
    ],
    "Do you have kidney issues?": [
        "Rowasa",
        "Monoconal antibody",
        "Azathioprine",
        "mercaptopurine",
        "Canasa",
        "Mesalamine",
        "Pentasa"
    ],
    "Are you over 65?": [
        "Tofacitinib",
        "Etrasimod",
        "Filgotinib",
        "Ozanimod",
        "Upadacitinib",
        "Methotrexate"
    ],
    "Are you under 6?": [
        "Adalimumab",
        "Infliximab",
        "Biologics"
    ],
    "Are you under 16?": [
        "Etrasimod"
    ],
    "Do you have mild Crohn\u2019s?": [
        "Biologics",
        "small molecule medicine",
        "Monocolna antibody",
        "Interleukin Inhibitor"
    ],
    "Do you have severe Crohn\u2019s?": [],
    "Do you have mild UC?": [
        "Biologics",
        "small molecule medicine",
        "Mirikizumab",
        "Monocolna antibody",
        "Interleukin Inhibitor"
    ],
    "Do you have severe UC?": [
        "Canasa",
        "Mesalamine",
        "Pentasa",
        "Rowasa"
    ],
    "Do you have Crohn's?": [
        "Etrasimod",
        "Filgotinib",
        "Mirikizumab",
        "Ozanimod",
        "Canasa",
        "Mesalamine",
        "Pentasa",
        "Rowasa",
        "Ozanimod",
        "Tofacitinib",
        "Gollimumab",
        "Mesalazine",
        "Beclometasone diprpionate"
    ],
    "Do you have UC?": [
        "Methotrexate",
        "Golimumab"
    ],
    "Is this the first treatment?": [
        "Mirikizumab",
        "Vedolizumab"
    ]
}

possible_drugs=drug_list = [
    "Abrilada", "Adalimumab-afzb", "Amjevita", "Adalimumab-atto", "Apriso", "Mesalamine",
    "Avsola", "Infliximab-axxq", "Azathioprine", "Azulfidine", "Budesonide", "Canasa",
    "Cimzia", "Certolizumab pegol", "Cipro", "Ciprofloxacin", "Colazal", "Balsalazide",
    "Cyltezo", "Adalimumab-adbm", "Depo-Medrol", "Dipentum", "Olsalazine", "Entocort EC",
    "Entyvio", "Vedolizumab", "Flagyl", "Metronidazole", "Hadlima", "Adalimumab-bwwd",
    "Hulio", "Adalimumab-fkjp", "Humira", "Adalimumab", "Hyrimoz", "Adalimumab-adaz",
    "Idacio", "Adalimumab-aacf", "Imuldosa", "Ustekinumab-srlf", "Imuran", "Inflectra",
    "Infliximab-dyyb", "IXIFI", "Infliximab-qbtx", "Jylamvo", "Lialda", "Medrol Dosepak",
    "Mercaptopurine (6-MP)", "Methotrexate", "Mesalamine", "Neoral", "Omvoh", "Otrexup",
    "Otulfi", "Pediapred", "Pentasa", "Prednisone", "Prograf", "Purinethol", "Pyzchiva",
    "Rasuvo", "Remicade", "Renflexis", "RINVOQ", "Rowasa", "Sandimmune", "Selarsdi",
    "Simlandi", "Simponi", "Skyrizi", "Solu-Medrol", "Stelara", "Tremfya", "Tyruko",
    "Tysabri", "UCERIS", "Unbranded Infliximab", "Velsipity", "Wezlana", "Xatmep",
    "Xeljanz", "Yesintek", "Yuflyma", "YUSIMRY", "Zeposia", "Zymfentra"
]
oral= ['Apriso', 'Azathioprine', 'Azulfidine', 'Budesonide', 'Cipro', 'Colazal', 'Dipentum', 'Entocort EC', 'Flagyl', 'Imuran', 'Jylamvo', 'Lialda', 'Medrol Dosepak', 'Mercaptopurine (6-MP)', 'Mesalamine', 'Methotrexate', 'Neoral', 'Pediapred', 'Pentasa', 'Prednisone', 'Prograf', 'Purinethol', 'RINVOQ', 'Sandimmune', 'UCERIS', 'Velsipity', 'Xatmep', 'Xeljanz', 'Zeposia']
rectal= ['Budesonide', 'Canasa', 'Mesalamine', 'Pentasa', 'Rowasa', 'Uceris']
IV= ['Avsola', 'Cipro', 'Entyvio', 'Imuldosa', 'Inflectra', 'IXIFI', 'Omvoh', 'Otulfi', 'Prograf', 'Pyzchiva', 'Remicade', 'Renflexis', 'Sandimmune', 'Selarsdi', 'Skyrizi', 'Solu-Medrol', 'Stelara', 'Tremfya', 'Tyruko', 'Tysabri', 'Unbranded Infliximab', 'Wezlana', 'Yesintek']
Injection = ['Abrilada', 'Amjevita', 'Cimzia', 'Cyltezo', 'Depo-Medrol', 'Entyvio', 'Hadlima', 'Hulio', 'Humira', 'Hyrimoz', 'Idacio', 'Imuldosa', 'Methotrexate', 'Omvoh', 'Otrexup', 'Otul', 'Pyzchiva', 'Rasuvo', 'Selarsdi', 'Simlandi', 'Simponi', 'Skyrizi', 'Stelara', 'Tremfya', 'Wezlana', 'Yesintek', 'Yuyma', 'YUSIMRY']

drugsWquestions = pd.json_normalize(questions)
drugsWquestions=drugsWquestions.T
drugsWquestions["Answers"]=answers
drugsWquestions= drugsWquestions.explode(0)
drugsWquestions = drugsWquestions[drugsWquestions["Answers"].notnull()] #filter out unaswered questions, might need to change this
drugsWquestions = drugsWquestions[drugsWquestions["Answers"] == "yes"]
Bad_Drugs=drugsWquestions[0].to_list()
result = list(set(possible_drugs) - set(Bad_Drugs) )- set(drugs_taken))
    return result

def map_answers(form):
    answers = []

    preg_val = form.get('pregnant', '').lower()
    age_str = form.get('age', '')
    try:
        age = int(age_str)
    except ValueError:
        age = None
    
    IBD = form.get('IBD', '').lower()
    severity = form.get('severity', '').lower()

    # Q1: Are you pregnant or planning to become pregnant?
    answers.append("yes" if preg_val == "yes" else "no")

    # Q2: Are you breast feeding?
    answers.append("yes" if preg_val == "breastfeeding" else "no")

    # Q3: Do you have kidney issues?
    answers.append("yes" if form.get('kidneys', '').lower() == "yes" else "no")

    # Q4: Are you over 65?
    answers.append("yes" if age is not None and age > 65 else "no")

    # Q5: Are you under 6?
    answers.append("yes" if age is not None and age < 6 else "no")

    # Q6: Are you under 16?
    answers.append("yes" if age is not None and age < 16 else "no")

    # Q7 and Q8: Allergy to ? (repeat allergies value twice)
    answers.append("no")
    answers.append("no")

    # Q9: Are you planning to take live vaccines?
    answers.append("yes" if form.get('vaccines', '').lower() == "yes" else "no")

    # Q10: Do you have mild Crohn’s?
    answers.append("yes" if IBD == "crohns" and severity == "mild" else "no")

    # Q11: Do you have mild UC?
    answers.append("yes" if IBD == "uc" and severity == "mild" else "no")

    # Q12: Do you have Crohn's?
    answers.append("yes" if IBD == "crohns" else "no")

    # Q13: Do you have UC?
    answers.append("yes" if IBD == "uc" else "no")

    # Q14: Is this the first treatment?
    answers.append("yes" if form.get('firstTreatment', '').lower() == "yes" else "no")

    '''
    # Q15: Route
    answers.append(form.get('route', '').lower())
    '''

    return answers

@app.route('/api/drug-options')
def get_drug_options():
    drugs_path = os.path.join(base_dir, 'jsons', 'drug_options.json')
    with open(drugs_path) as f:
        drug_options = json.load(f)
    return jsonify(drug_options)

@app.route('/upload', methods=['POST'])
def upload_file():
    form_data = request.form.to_dict()
    print("Form Data:", form_data)

    drugs_json = form_data.get('drugs')
    drugs = json.loads(drugs_json)
    drug_names = [entry['drug'] for entry in drugs]

    print("Metadata Results:")
    answers = map_answers(form_data)
    print(answers)
    metadata = parse_metadata(answers, drug_names)
    print(metadata)
    print("")

    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file uploaded'}), 400

    file_stream = BytesIO(file.read())
    matched_snps = parse_23andme_file(file_stream.readlines())

    print("Matched SNPs:")
    print(matched_snps)
    print("")

    path = check_pathway(matched_snps)

    print("Highest Pathway and Matched Meds:")
    print(path)
    print("")

    accepted = extract_valid_meds(path, metadata)
    print("Accepted drugs:")
    print(accepted)
    print("")

    valid_best_drugs = accepted['valid_best_drugs']
    valid_alternatives = accepted['valid_alternatives']

    combined_valid_drugs = list(set(valid_best_drugs + valid_alternatives))

    meds = [get_med_info(name) for name in combined_valid_drugs]

    meds_best = [get_med_info(name) for name in valid_best_drugs]
    meds_alt = [get_med_info(name) for name in valid_alternatives]

    if path == {}:
        return jsonify({
        'message': f'File {file.filename} uploaded and processed!',
        'matches': meds,
        'genes_and_snps': [],
        'best_drug': [],
        'alternatives': [],
        'citations': []
        })
    else:
        return jsonify({
        'message': f'File {file.filename} uploaded and processed!',
        'matches': meds,
        'genes_and_snps': [],
        'best_drug': meds_best,
        'alternatives': meds_alt,
        'citations': [path[node]['citation'] for node in path]
        })

if __name__ == '__main__':
    app.run(debug=True)
