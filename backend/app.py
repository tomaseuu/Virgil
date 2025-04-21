from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO

app = Flask(__name__)
CORS(app)

TARGET_SNPS = {
    'rs2066844': 'NOD2',
    'rs2066845': 'NOD2',
    'rs2066847': 'NOD2',
    'rs1004819': 'IL23R',
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
}

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
