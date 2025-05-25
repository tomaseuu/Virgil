from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO
import requests
import pandas as pd
import os
import json

app = Flask(__name__)
CORS(app)

TARGET_SNPS = {
'rs2066847': 'NOD2',
'rs2066843': 'NOD2',
'rs2076756': 'NOD2',
'rs2066847': 'NOD2',
'rs122112067': 'NOD2',
'rs6431660': 'ATG16L1',
'rs13412102': 'ATG16L1',
'rs2241880': 'ATG16L1',
'rs2228055': 'IL10',
'rs7517847': 'IL23R',
}


'''
NOD2 -------------
Asacol HD
Pentasa
Lialda
Apriso
Delzicol
Canasa
Rowasa
Colazal
Dipentum
Azulfidine
IL23R-------------
Risankizumab(Skyrizi)
Tremfya
Ixekizumab (Taltz)
'''

meds = {
    'NOD2': '5-ASA',
    'IL10': 'N/A',
    'IL23R': 'Janus Kinase (JAK) Inhibitors',
    'ATG16L1': 'Siromulus (MTOR inhibitor)',
}
    
'''
    'rs2066843': 'NOD2; anti-tumor necrosis factor (TNF)-α and TDM (Therapeutic drug monitoring)',
    'rs2076756': 'NOD2; AZA/6-MP',
    'rs2066844': 'NOD2; Azathioprine',
    'rs2066847': 'NOD2; Steroids',
    'rs2066847': 'NOD2; 5-ASA (aminosalicylates)',

    'rs1285933': 'CLECA5A and CLECA7A',
    'rs16910631': 'CLECA5A and CLECA7A',
    'rs2078178': 'CLECA5A and CLECA7A',

    'rs1004819': 'IL23R',
    'rs7517847': 'IL23R; Ustekinumab(Stelara)', 
    'rs10489629': 'IL23R; Risankizumab(Skyrizi): Strong assosciation wit crohns disease',
    'rs2201841': 'IL23R; Guselkumab(Tremfya) and Tildrakizumba (llumya)',
    'rs11465804': 'IL23R; Secukinumab(Cosentyx) and ixekizumab(Taltz)',
    'rs11209026': 'IL23R',
    'rs11209032': 'IL23R',
    'rs1343151': 'IL23R',
    'rs10889677': 'IL23R',

    'rs2241880': 'Thiopurines (Azathiprien and Mercaptopurine)',
    'rs13412102': 'Common polymorphisms: rs2241880; leading to a T300A conversion',
    'rs6431660': 'Common polymorphisms: rs2241880; leading to a T300A conversion',
    'rs1441090': 'Common polymorphisms: rs2241880; leading to a T300A conversion',
    'rs1441090': 'Common polymorphisms: rs2241880; leading to a T300A conversion',
    'rs2289472': 'Common polymorphisms: rs2241880; leading to a T300A conversion',
    'rs2241880': 'MAIN SNP, T300A;  therapeutic inhibition of pathways that lead to CASP3 activation might restore autophagy and gut homeostasis',
    'rs2241879': 'Common polymorphisms: rs2241880; leading to a T300A conversion',
    'rs3792106': 'Common polymorphisms: rs2241880; leading to a T300A conversion',
    'rs4663396': 'Common polymorphisms: rs2241880; leading to a T300A conversion',

    'rs12423058': 'ATGL1',
    'rs1058768': 'ATGL1',
    'rs17613241': 'ATGL1',
    'rs10497517': 'ATGL1',
    'rs2595453': 'ATGL1',
    'rs211716': 'ATGL1',
    'rs211715': 'ATGL1',
    'rs1320308': 'ATGL1',
    'rs6897932': 'ATGL1',
    'rs2241880': 'ATGL1',
    'rs6730351': 'ATGL1',
    'rs4861358': 'ATGL1',
    'rs1165165': 'ATGL1',
    'rs10948733': 'ATGL1',
    'rs303997': 'ATGL1',
    'rs10483261': 'ATGL1',
    'rs2291479': 'ATGL1',
    'rs2282135': 'ATGL1',
    'rs1869348': 'ATGL1',
    'rs3190321': 'ATGL1',
    'rs3762685': 'ATGL1',
    'rs9257694': 'ATGL1',
    'rs2297792': 'ATGL1',
    'rs2066845': 'ATGL1',
    'rs11549094': 'ATGL1',
    'rs3129096': 'ATGL1',
    'rs3116817': 'ATGL1',
    'rs541169': 'ATGL1',
    'rs3751325': 'ATGL1',
    'rs2271885': 'ATGL1',
    'rs2157453': 'ATGL1',
    'rs1050152': 'ATGL1',
    'rs1867380': 'ATGL1',
    'rs12984558': 'ATGL1',
    'rs1864147': 'ATGL1',
    'rs32857': 'ATGL1',
    'rs1061409': 'ATGL1',
    'rs3810071': 'ATGL1',
    'rs3812762': 'ATGL1',
    'rs203462': 'ATGL1',
    'rs6425977': 'ATGL1',
    'rs3829486': 'ATGL1',
    'rs2191423': 'ATGL1',

    'rs10870077': 'CARD9; Antifungal treatments',
    'rs4077515': 'CARD10; Antifungal treatments',
    'rs10781499': 'CARD11; Antifungal treatments',
    'rs141992399': 'CARD12; Antifungal treatments',
    'rs200735402': 'CARD13; Antifungal treatments',
    'rs22291130': 'CARD14; Antifungal treatments',
    'rs4986790': 'CARD15; Antifungal treatments',

    'rs1816702': 'TLR2; anti-TNF therapy response',
    'rs4696480': 'TLR2; anti-TNF therapy response',
    'rs2569190': 'CD14; anti-TNF therapy response',
    'rs4251961': 'IL1RN; anti-TNF therapy response',
    'rs3804099': 'TLR2; anti-TNF therapy response',
    'rs11938228': 'TLR2; anti-TNF therapy response',
    'rs5030728': 'TLR4; anti-TNF therapy response',
    'rs1554973': 'TLR4; anti-TNF therapy response',
    'rs187084': 'TLR9; anti-TNF therapy response',
    'rs352139': 'TLR9; anti-TNF therapy response',
    'rs11465996': 'LY96; anti-TNF therapy response',
    'rs7222094': 'MAP3K14; anti-TNF therapy response',
    'rs361525': 'TNFA; anti-TNF therapy response',
    'rs4149570': 'TNFRSF1A; anti-TNF therapy response',
    'rs6927172': 'TNFAIP3; anti-TNF therapy response',
    'rs4848306': 'IL1B; anti-TNF therapy response',
    'rs10499563': 'IL6; anti-TNF therapy response',
    'rs2275913': 'IL17A; anti-TNF therapy response',
    'rs2430561': 'IFNG; anti-TNF therapy response',

    'rs3790622': 'Interleukin 10 (IL-10)',
    'rs1800896': 'Interleukin 10 (IL-10)',
    'rs1800872': 'Interleukin 10 (IL-10)',
    'rs2228054': 'Interleukin 10 (IL-10)',
    'rs2228055': 'Interleukin 10 (IL-10)',
    
    'rs7848647': 'TNFSF15/TL1A (Tumor Necrosis Factor Superfamily Member 15)',
    'rs4979462': 'TNFSF15/TL1A (Tumor Necrosis Factor Superfamily Member 15)',
}'''

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
        if rsid in TARGET_SNPS:
            found[rsid] = {
                'description': TARGET_SNPS[rsid],
                'genotype': genotype
            }
    return found

def check_pathway_a(snps):
    NOD2 = False
    ATG16L1 = False
    IL10 = False
    IL23R = False
    for _, info in snps.items():
        if info['description'] == 'NOD2':
            NOD2 = True
        elif info['description'] == 'ATG16L1':
            ATG16L1 = True
        elif info['description'] == 'IL10':
            IL10 = True
        elif info['description'] == 'IL23R':
            IL23R = True

    if NOD2:
        return "NOD2"
    elif ATG16L1:
        return "ATG16L1"
    elif IL10:
        return "IL10"
    elif IL23R:
        return "IL23R"
    else:
        return "None"
    
def get_meds(drug_name):
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
    # answers=["yes","no","yes","no","no","yes","no","yes","yes","no","yes","yes","no","yes"] # will change to whatever is in website
    drugsWquestions["Answers"]=answers

    csv_drugs = os.path.join(base_dir, 'excel', 'scraped_meds.csv')
    scrapedDrugs=pd.read_csv(csv_drugs)
    #scraped does not have all drugs
    #need to make sure compatible with API
    possible_drugs=scrapedDrugs["name"].to_list()

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
    allergy_val = form.get('allergies', '')
    answers.append(allergy_val if allergy_val else "no")
    answers.append(allergy_val if allergy_val else "no")

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

    return answers


@app.route('/upload', methods=['POST'])
def upload_file():
    form_data = request.form.to_dict()
    print("Form Data:", form_data)

    drugs_json = form_data.get('drugs')
    drugs = json.loads(drugs_json)
    drug_names = [entry['drug'] for entry in drugs]

    print("Drugs Taken:")
    print(drug_names)
    print("")

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

    path_a = check_pathway_a(matched_snps)

    meds = [get_meds('skyrizi')]

    if path_a == "None":
        return jsonify({
        'message': f'File {file.filename} uploaded and processed!',
        'matches': meds
        })
    else:
        return jsonify({
        'message': f'File {file.filename} uploaded and processed!',
        'matches': meds
        })

    '''
    return jsonify({
        'message': f'File {file.filename} uploaded and processed!',
        'matches': matched_snps
    })'''

if __name__ == '__main__':
    app.run(debug=True)
