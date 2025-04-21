import React, { useState, useRef } from 'react';
import {
  ChakraProvider,
  Box,
  Heading,
  Text,
  Button,
  Input,
  VStack,
  HStack,
  IconButton,
  FormControl,
  FormLabel,
  Select,
  Stack,
  Checkbox,
  CheckboxGroup
} from '@chakra-ui/react';
import { CloseIcon, DownloadIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';

function UploadFilePage() {
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [smoking, setSmoking] = useState('');
  const [autoimmune, setAutoimmune] = useState('');
  const [geoLocation, setGeoLocation] = useState('');
  const [areaLocation, setAreaLocation] = useState('');
  const [IBD, setIBD] = useState('');
  const [anxiety, setAnxiety] = useState('');
  const [diet, setDiet] = useState('');
  const [pregnant, setPregnant] = useState('');
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [surgicalHistory, setSurgicalHistory] = useState([]);
  const [allergies, setAllergies] = useState([]);

  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleUpload = async () => {
    if (!file) return alert('No file selected!');

    const formData = new FormData();
    formData.append('file', file);

    formData.append('age', age);
    formData.append('sex', sex);
    formData.append('ethnicity', ethnicity);
    formData.append('familyHistory', familyHistory);
    formData.append('smoking', smoking);
    formData.append('autoimmune', autoimmune);
    formData.append('geoLocation', geoLocation);
    formData.append('areaLocation', areaLocation);
    formData.append('IBD', IBD);
    formData.append('anxiety', anxiety);
    formData.append('diet', diet);
    formData.append('pregnant', pregnant);
    formData.append('medicalHistory', medicalHistory);
    formData.append('surgicalHistory', surgicalHistory);
    formData.append('allergies', allergies);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const results = response.data.matches || [];
      console.log(results);
      navigate('/results', { state: { results } });

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    }
  };

  const selectStyles = {
    bg: '#322a80',
    color: 'white',
    _hover: { bg: '#3d3390' },
    _focus: { borderColor: '#a28df0' },
    iconColor: 'white',
  };

  const optionStyle = { backgroundColor: '#322a80', color: 'white' };

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="#4134bb" display="flex" flexDirection="column">
        <NavBar />
        <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" px={10} pt="20vh" textAlign="center" maxW="lg" mx="auto">
          <VStack spacing={4} pb={8}>
            <Heading size="2xl" color="white" fontFamily="'Glacial Indifference Bold'" textShadow="2px 2px 10px rgba(0, 0, 0, 0.3)">
              Upload Your File
            </Heading>

            <Text fontSize="xl" color="white" fontFamily="'Glacial Indifference Reg'" letterSpacing="1px" fontWeight="light" maxW="xl">
              Upload your 23andMe results to get started.
            </Text>

            <FormControl>
              <FormLabel textColor="white">Age</FormLabel>
              <Input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                textColor="white"
                bg="#322a80"
                _focus={{ borderColor: '#a28df0' }}
                placeholder="Enter your age"
                _placeholder={{ color: 'white' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">Sex</FormLabel>
              <Select
                {...selectStyles}
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                placeholder="Select option"
                _placeholder={{ color: 'gray.300', backgroundColor: 'transparent' }}
                _focus={{ borderColor: '#a28df0' }}
                _hover={{ bg: '#3d3390' }}
                sx={{
                  option: {
                    backgroundColor: '#322a80',
                    color: 'white',
                  },
                  ':not([data-placeholder="true"])': {
                    backgroundColor: '#2e2a68',
                  }
                }}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">Ethnicity</FormLabel>
              <Select
                {...selectStyles}
                value={ethnicity}
                onChange={(e) => setEthnicity(e.target.value)}
                placeholder="Select option"
                _placeholder={{ color: 'white', backgroundColor: 'transparent' }}
                _focus={{ borderColor: '#a28df0' }}
                _hover={{ bg: '#3d3390' }}
                sx={{
                  option: {
                    backgroundColor: '#322a80',
                    color: 'white',
                  },
                  ':not([data-placeholder="true"])': {
                    backgroundColor: '#2e2a68',
                  }
                }}
              >
                <option style={optionStyle} value="AIAN">American Indian or Alaska Native</option>
                <option style={optionStyle} value="asian">Asian</option>
                <option style={optionStyle} value="black">Black or African American</option>
                <option style={optionStyle} value="hispanic">Hispanic or Latino</option>
                <option style={optionStyle} value="NHPI">Native Hawaiian or Other Pacific Islander</option>
                <option style={optionStyle} value="white">White</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">Family History</FormLabel>
              <Select
                {...selectStyles}
                value={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.value)}
                placeholder="Select option"
                _placeholder={{ color: 'white', backgroundColor: 'transparent' }}
                _focus={{ borderColor: '#a28df0' }}
                _hover={{ bg: '#3d3390' }}
                sx={{
                  option: {
                    backgroundColor: '#322a80',
                    color: 'white',
                  },
                  ':not([data-placeholder="true"])': {
                    backgroundColor: '#2e2a68',
                  }
                }}
              >
                <option style={optionStyle} value="fh_yes">Yes</option>
                <option style={optionStyle} value="fh_no">No</option>
                <option style={optionStyle} value="unknown">Unknown</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">History of Smoking</FormLabel>
              <Select
                {...selectStyles}
                value={smoking}
                onChange={(e) => setSmoking(e.target.value)}
                placeholder="Select option"
                _placeholder={{ color: 'white', backgroundColor: 'transparent' }}
                _focus={{ borderColor: '#a28df0' }}
                _hover={{ bg: '#3d3390' }}
                sx={{
                  option: {
                    backgroundColor: '#322a80',
                    color: 'white',
                  },
                  ':not([data-placeholder="true"])': {
                    backgroundColor: '#2e2a68',
                  }
                }}
              >
                <option style={optionStyle} value="smoke0">Never Smoked</option>
                <option style={optionStyle} value="smoke1">Ex-Smoker</option>
                <option style={optionStyle} value="smoke2">Smokes Occasionally</option>
                <option style={optionStyle} value="smoke3">Regular Smoker</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">Autoimmune Diseases</FormLabel>
              <Select
                {...selectStyles}
                value={autoimmune}
                onChange={(e) => setAutoimmune(e.target.value)}
                placeholder="Select option"
                _placeholder={{ color: 'white', backgroundColor: 'transparent' }}
                _focus={{ borderColor: '#a28df0' }}
                _hover={{ bg: '#3d3390' }}
                sx={{
                  option: {
                    backgroundColor: '#322a80',
                    color: 'white',
                  },
                  ':not([data-placeholder="true"])': {
                    backgroundColor: '#2e2a68',
                  }
                }}
              >
                <option style={optionStyle} value="none">None</option>
                <option style={optionStyle} value="celiac">Celiac</option>
                <option style={optionStyle} value="rheumatoid">Rheumatoid Arthritis</option>
                <option style={optionStyle} value="psoriasis">Psoriasis</option>
                <option style={optionStyle} value="other">Other</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">Geographic Location</FormLabel>
              <Select
                {...selectStyles}
                value={geoLocation}
                onChange={(e) => setGeoLocation(e.target.value)}
                placeholder="Select option"
                _placeholder={{ color: 'white', backgroundColor: 'transparent' }}
                _focus={{ borderColor: '#a28df0' }}
                _hover={{ bg: '#3d3390' }}
                sx={{
                  option: {
                    backgroundColor: '#322a80',
                    color: 'white',
                  },
                  ':not([data-placeholder="true"])': {
                    backgroundColor: '#2e2a68',
                  }
                }}
              >
                <option style={optionStyle} value="north_america">North America</option>
                <option style={optionStyle} value="west_eu">Western Europe</option>
                <option style={optionStyle} value="east_eu">Eastern Europe</option>
                <option style={optionStyle} value="east_asia">East Asia</option>
                <option style={optionStyle} value="south_asia">South Asia</option>
                <option style={optionStyle} value="se_asia">Southeast Asia</option>
                <option style={optionStyle} value="middle_east">Middle East / North Africa</option>
                <option style={optionStyle} value="sub_africa">Sub-Saharan Africa</option>
                <option style={optionStyle} value="latin_america">Latin America</option>
                <option style={optionStyle} value="oceana">Oceania</option>
                <option style={optionStyle} value="multiple">Multiple regions / moved around</option>
                <option style={optionStyle} value="other">Other</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">Type of Area</FormLabel>
              <Select
                {...selectStyles}
                value={areaLocation}
                onChange={(e) => setAreaLocation(e.target.value)}
                placeholder="Select option"
                _placeholder={{ color: 'white', backgroundColor: 'transparent' }}
                _focus={{ borderColor: '#a28df0' }}
                _hover={{ bg: '#3d3390' }}
                sx={{
                  option: {
                    backgroundColor: '#322a80',
                    color: 'white',
                  },
                  ':not([data-placeholder="true"])': {
                    backgroundColor: '#2e2a68',
                  }
                }}
              >
                <option style={optionStyle} value="rural">Rural</option>
                <option style={optionStyle} value="suburban">Suburban</option>
                <option style={optionStyle} value="urban">Urban</option>
                <option style={optionStyle} value="moved">Moved between rural and urban/suburban</option>
                <option style={optionStyle} value="other">Other</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">Type of IBD</FormLabel>
              <Select
                {...selectStyles}
                value={IBD}
                onChange={(e) => setIBD(e.target.value)}
                placeholder="Select option"
                _placeholder={{ color: 'gray.300', backgroundColor: 'transparent' }}
                _focus={{ borderColor: '#a28df0' }}
                _hover={{ bg: '#3d3390' }}
                sx={{
                  option: {
                    backgroundColor: '#322a80',
                    color: 'white',
                  },
                  ':not([data-placeholder="true"])': {
                    backgroundColor: '#2e2a68',
                  }
                }}
              >
                <option value="crohns">Crohn's Disease</option>
                <option value="uc">Ulcerative Colitis</option>
                <option value="both">Both</option>
                <option value="other">Unknown</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">Anxiety and Stress Levels</FormLabel>
              <Select
                {...selectStyles}
                value={anxiety}
                onChange={(e) => setAnxiety(e.target.value)}
                placeholder="Select option"
                _placeholder={{ color: 'gray.300', backgroundColor: 'transparent' }}
                _focus={{ borderColor: '#a28df0' }}
                _hover={{ bg: '#3d3390' }}
                sx={{
                  option: {
                    backgroundColor: '#322a80',
                    color: 'white',
                  },
                  ':not([data-placeholder="true"])': {
                    backgroundColor: '#2e2a68',
                  }
                }}
              >
                <option value="low">Low (rarely feel anxious or stressed)</option>
                <option value="moderate">Moderate (feel stress or anxiety occasionally)</option>
                <option value="high">High (often feel anxious or stressed)</option>
                <option value="very_high">Very High (stress or anxiety is frequent and overwhelming)</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">Diet</FormLabel>
              <Select
                {...selectStyles}
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                placeholder="Select option"
                _placeholder={{ color: 'gray.300', backgroundColor: 'transparent' }}
                _focus={{ borderColor: '#a28df0' }}
                _hover={{ bg: '#3d3390' }}
                sx={{
                  option: {
                    backgroundColor: '#322a80',
                    color: 'white',
                  },
                  ':not([data-placeholder="true"])': {
                    backgroundColor: '#2e2a68',
                  }
                }}
              >
                <option value="balanced">Balanced (mix of fruits, vegetables, grains, proteins, and fats)</option>
                <option value="western">Western (high in processed foods, red meat, sugar, and fat)</option>
                <option value="vegetarian">Vegetarian (no meat, but includes dairy and/or eggs)</option>
                <option value="vegan">Vegan (no animal products at all)</option>
                <option value="mediterranean">Mediterranean (rich in veggies, olive oil, legumes, fish, and whole grains)</option>
                <option value="low_fodmap">Low FODMAP (avoid fermentable carbs for gut sensitivity)</option>
                <option value="other">Other</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">Pregnant</FormLabel>
              <Select
                {...selectStyles}
                value={pregnant}
                onChange={(e) => setPregnant(e.target.value)}
                placeholder="Select option"
                _placeholder={{ color: 'gray.300', backgroundColor: 'transparent' }}
                _focus={{ borderColor: '#a28df0' }}
                _hover={{ bg: '#3d3390' }}
                sx={{
                  option: {
                    backgroundColor: '#322a80',
                    color: 'white',
                  },
                  ':not([data-placeholder="true"])': {
                    backgroundColor: '#2e2a68',
                  }
                }}
              >
                <option value="yes">Yes</option>
                <option value="breastfeeding">Breastfeeding</option>
                <option value="planning">Planning</option>
                <option value="no">No</option>
                <option value="na">Not Applicable</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">Allergies</FormLabel>
              <Box
                bg="rgba(255, 255, 255, 0.1)"
                p={4}
                borderRadius="md"
                border="1px solid #ccc"
              >
                <CheckboxGroup
                  value={allergies}
                  onChange={(values) => setAllergies(values)}
                >
                  <Stack color="white" textAlign="left" spacing={4} direction="column">
                    <Checkbox colorScheme="purple" value="amino_salic">Aminosalicylate or Salicylate pain relievers such as aspirin</Checkbox>
                    <Checkbox colorScheme="purple" value="sulfa">Sulfonamide or Salicylate, Sulfa</Checkbox>
                    <Checkbox colorScheme="purple" value="none">None of the above</Checkbox>
                  </Stack>
                </CheckboxGroup>
              </Box>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">Medical History</FormLabel>
              <Box
                bg="rgba(255, 255, 255, 0.1)"
                p={4}
                borderRadius="md"
                border="1px solid #ccc"
              >
                <CheckboxGroup
                  value={medicalHistory}
                  onChange={(values) => setMedicalHistory(values)}
                >
                  <Stack color="white" textAlign="left" spacing={4} direction="column">
                    <Checkbox colorScheme="purple" value="antibiotics">History of frequent antibiotic use</Checkbox>
                    <Checkbox colorScheme="purple" value="nsaids">Regular use of NSAIDs (e.g., ibuprofen, naproxen)</Checkbox>
                    <Checkbox colorScheme="purple" value="early_onset">Early onset of symptoms (childhood/teen years)</Checkbox>
                    <Checkbox colorScheme="purple" value="anti_tnf_nonresponse">Non-response to anti-TNF therapy</Checkbox>
                    <Checkbox colorScheme="purple" value="none">None of the above</Checkbox>
                  </Stack>
                </CheckboxGroup>
              </Box>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white" textAlign="left">Surgical History</FormLabel>
              <Box
                bg="rgba(255, 255, 255, 0.1)"
                p={4}
                borderRadius="md"
                border="1px solid #ccc"
              >
                <CheckboxGroup
                  value={surgicalHistory}
                  onChange={(values) => setSurgicalHistory(values)}
                >
                  <Stack color="white" textAlign="left" spacing={4} direction="column">
                    <Checkbox colorScheme="purple" value="colectomy">Colectomy</Checkbox>
                    <Checkbox colorScheme="purple" value="bowel_resection">Bowel Resection</Checkbox>
                    <Checkbox colorScheme="purple" value="ileostomy">Ileostomy</Checkbox>
                    <Checkbox colorScheme="purple" value="colostomy">Colostomy</Checkbox>
                    <Checkbox colorScheme="purple" value="strictureplasty">Strictureplasty</Checkbox>
                    <Checkbox colorScheme="purple" value="fistula_repair">Fistula Repair</Checkbox>
                    <Checkbox colorScheme="purple" value="abscess_drainage">Abscess Drainage</Checkbox>
                    <Checkbox colorScheme="purple" value="other_surgery">Other Surgeries Related to IBD</Checkbox>
                    <Checkbox colorScheme="purple" value="none">None of the above</Checkbox>
                  </Stack>
                </CheckboxGroup>
              </Box>
            </FormControl>

            <Box
              paddingTop={4}>
              <Input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                display="none"
              />
              <Button
                as="span"
                bg="transparent"
                border="2px solid #5c3cae"
                color="white"
                borderRadius="full"
                _hover={{
                  bg: '#5c3cae',
                  color: 'white',
                  transform: 'scale(1.05)',
                  boxShadow: 'lg',
                }}
                _active={{
                  bg: '#3b267d',
                  color: 'white',
                }}
                fontFamily="'Glacial Indifference Reg'"
                fontWeight="bold"
                letterSpacing="1px"
                px={8}
                py={4}
                leftIcon={<DownloadIcon />}
                onClick={() => fileInputRef.current.click()}
              >
                {file ? 'Change 23andMe File' : 'Choose 23andMe File'}
              </Button>
            </Box>

            {file && (
              <HStack spacing={3}>
                <Text color="white" fontSize="sm" maxW="250px" isTruncated>
                  {file.name}
                </Text>
                <IconButton
                  icon={<CloseIcon />}
                  size="sm"
                  aria-label="Remove file"
                  onClick={handleRemoveFile}
                  variant="ghost"
                  color="gray.300"
                  _hover={{
                    bg: '#5c3cae',
                    color: 'white',
                    borderRadius: '50%',
                  }}
                  _active={{
                    bg: '#3b267d',
                    color: 'white',
                  }}
                />
              </HStack>
            )}

            <Button
              pt={4}
              _hover={{
                bg: '#4a2f8d',
                transform: 'scale(1.05)',
                boxShadow: 'xl',
              }}
              _active={{ bg: '#3b267d' }}
              borderRadius="full"
              color="white"
              bg="#5c3cae"
              size="lg"
              fontFamily="'Glacial Indifference Reg'"
              fontWeight="bold"
              letterSpacing="1px"
              onClick={handleUpload}
              px={8}
              py={4}
              boxShadow="2xl"
            >
              Submit Form
            </Button>
          </VStack>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default UploadFilePage;
