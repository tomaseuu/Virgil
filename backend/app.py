from flask import Flask, request, jsonify
from flask_cors import CORS
from io import BytesIO

app = Flask(__name__)
CORS(app)

TARGET_SNPS = {
    'rs2066844': 'NOD2',
    'rs2066845': 'NOD2',
    'rs2066847': 'NOD2',
    'rs1004819': 'IL23R'
}

def parse_23andme_stream(file_stream):
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
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'No file uploaded'}), 400

    file_stream = BytesIO(file.read())
    matched_snps = parse_23andme_stream(file_stream.readlines())

    print(matched_snps)

    return jsonify({
        'message': f'File {file.filename} uploaded and processed!',
        'matches': matched_snps
    })

if __name__ == '__main__':
    app.run(debug=True)
