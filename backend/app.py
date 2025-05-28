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

snps_path = os.path.join(base_dir, 'jsons', 'target_snps.json')
with open(snps_path, 'r') as f:
    TARGET_SNPS = json.load(f)

meds_path = os.path.join(base_dir, 'jsons', 'medications.json')
with open(meds_path, 'r') as f:
    TARGET_MEDS = json.load(f)

def parse_23andme_file(file_stream):
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
            result[node] = {}
        result[node][snp] = description

    return result

def get_med_info(drug_name):
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

    '''print("\nMedication Summary for:", drug_name.capitalize())
    for k, v in info.items():
        print(f"\n**{k}**:\n{v[:1000] if isinstance(v, str) else v}")'''

    return info

def parse_metadata(answers, drugs_taken):
    base_dir = os.path.dirname(__file__)
    csv_metadata = os.path.join(base_dir, 'excel', 'metadata_questions.csv')
    drugsWquestions=pd.read_csv(csv_metadata)
    questions=drugsWquestions["Question:"]
    drugsWquestions["Answers"]=answers
    
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
    drugsWquestionsLong=pd.melt(drugsWquestions, id_vars=["Question:","Answers"], var_name="Questions", value_name="Bad_Drugs")
    drugsWquestionsLong = drugsWquestionsLong[drugsWquestionsLong["Bad_Drugs"].notnull()] #filter out NaNs in drug column
    drugsWquestionsLong = drugsWquestionsLong[drugsWquestionsLong["Answers"].notnull()] #filter out unaswered questions, might need to change this
    drugsWquestionsLong = drugsWquestionsLong[drugsWquestionsLong["Answers"] == "yes"]
    Bad_Drugs=drugsWquestionsLong["Bad_Drugs"].to_list()

    result = list(set(possible_drugs) - set(Bad_Drugs) - set(drugs_taken))
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
    print(parse_metadata(answers, drug_names))
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

    print("Highest Pathway:")
    print(path)
    print("")

    med_names = [ "Zymfentra" ]

    meds = [get_med_info(name) for name in med_names]

    # meds = [get_med_info('skyrizi')]

    if path == "None":
        return jsonify({
        'message': f'File {file.filename} uploaded and processed!',
        'matches': meds
        })
    else:
        return jsonify({
        'message': f'File {file.filename} uploaded and processed!',
        'matches': meds
        })

if __name__ == '__main__':
    app.run(debug=True)
