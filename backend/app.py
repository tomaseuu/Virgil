from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO

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


@app.route('/upload', methods=['POST'])
def upload_file():
    form_data = request.form.to_dict()
    print("Form Data:", form_data)


    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file uploaded'}), 400

    file_stream = BytesIO(file.read())
    matched_snps = parse_23andme_file(file_stream.readlines())

    print(matched_snps)

    return jsonify({
        'message': f'File {file.filename} uploaded and processed!',
        'matches': matched_snps
    })

if __name__ == '__main__':
    app.run(debug=True)
