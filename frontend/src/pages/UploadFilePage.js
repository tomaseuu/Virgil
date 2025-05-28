import React, { useState, useEffect, useRef } from 'react';
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
  CheckboxGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Flex,
  useToast,
} from '@chakra-ui/react';
import { CloseIcon, DownloadIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';

function UploadFilePage() {
  const [age, setAge] = useState('');
  // const [sex, setSex] = useState('');
  //const [ethnicity, setEthnicity] = useState('');
  //const [familyHistory, setFamilyHistory] = useState('');
  //const [smoking, setSmoking] = useState('');
  //const [autoimmune, setAutoimmune] = useState('');
  //const [geoLocation, setGeoLocation] = useState('');
  //const [areaLocation, setAreaLocation] = useState('');
  const [IBD, setIBD] = useState('');
  //const [anxiety, setAnxiety] = useState('');
  //const [diet, setDiet] = useState('');
  const [pregnant, setPregnant] = useState('');
  //const [medicalHistory, setMedicalHistory] = useState([]);
  //const [surgicalHistory, setSurgicalHistory] = useState([]);
  //const [allergies, setAllergies] = useState([]);
  const [kidneys, setKidneys] = useState('');
  const [vaccines, setVaccines] = useState('');
  const [severity, setSeverity] = useState('');
  const [firstTreatment, setFirstTreatment] = useState('');
  const [route, setRoute] = useState('');

  const [drugEntries, setDrugEntries] = useState([{ drug: '', reaction: '' }]);


  const [agree, setAgree] = useState([]);

  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [drugOptions, setDrugOptions] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/drug-options')
      .then((res) => res.json())
      .then((data) => setDrugOptions(data))
      .catch((err) => console.error('Error fetching drug options:', err));
  }, []);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const toast = useToast();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleDrugChange = (index, field, value) => {
    const updated = [...drugEntries];
    updated[index][field] = value;
    setDrugEntries(updated);
  };

  const addDrugEntry = () => {
    setDrugEntries([...drugEntries, { drug: '', reaction: '' }]);
  };

  const removeDrugEntry = (index) => {
    const updated = drugEntries.filter((_, i) => i !== index);
    setDrugEntries(updated);
  };

  const handleUpload = async () => {
    let agree1error = true;
    let agree2error = true;
    let i = 0;
    for (i = 0; i < 2; i++) {
      if (agree[i] === 'agree1') {
        agree1error = false;
      } else if (agree[i] === 'agree2') {
        agree2error = false;
      }
    }
    if (agree1error || agree2error) {
      toast({
        title: 'User Agreement Required',
        description: 'You must agree to both parts of the user agreement before uploading.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please choose a file to upload.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    formData.append('age', age);
    formData.append('IBD', IBD);
    formData.append('pregnant', pregnant);
    formData.append('kidneys', kidneys);
    formData.append('vaccines', vaccines);
    formData.append('severity', severity);
    formData.append('firstTreatment', firstTreatment);
    formData.append('route', route);
    formData.append('drugs', JSON.stringify(drugEntries));

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
      toast({
        title: 'Upload Failed',
        description: 'Something went wrong while uploading. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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

          {/*
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
          */}

          {/*
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
            */}

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
                <option value="other">Unsure</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">Severity of IBD</FormLabel>
              <Select
                {...selectStyles}
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
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
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </Select>
            </FormControl>

          {/*
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
          */}

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
              <FormLabel textColor="white">History of Kidney Issues</FormLabel>
              <Select
                {...selectStyles}
                value={kidneys}
                onChange={(e) => setKidneys(e.target.value)}
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
                <option value="yes">Current</option>
                <option value="yes">Past</option>
                <option value="none">None</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">Plans To Take Live Vaccines</FormLabel>
              <Select
                {...selectStyles}
                value={vaccines}
                onChange={(e) => setVaccines(e.target.value)}
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
                <option value="yes">Yes (Measles, Rotavirus, Smallpox, Chicken Pox, Yellow Fever, etc.)</option>
                <option value="no">No</option>
              </Select>
            </FormControl>

          {/*
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
          */}

            <FormControl>
              <FormLabel textColor="white">Is This Your First Treatment?</FormLabel>
              <Select
                {...selectStyles}
                value={firstTreatment}
                onChange={(e) => setFirstTreatment(e.target.value)}
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
                <option value="no">No</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel textColor="white">Drug Administration Route</FormLabel>
              <Select
                {...selectStyles}
                value={route}
                onChange={(e) => setRoute(e.target.value)}
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
                <option value="inject_prefer">Prefer Injection</option>
                <option value="oral_prefer">Prefer Oral</option>
                <option value="iv_prefer">Prefer IV</option>
                <option value="rectal_prefer">Prefer Rectal</option>
                <option value="inject_only">Must Be Injection</option>
                <option value="oral_only">Must Be Oral</option>
                <option value="iv_only">Must Be IV</option>
                <option value="rectal_only">Must Be Rectal</option>
                <option value="none">No Preference</option>
              </Select>
            </FormControl>

          {/*
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
            */}

            <FormLabel textColor="white" mt={4}>Medications & Reactions</FormLabel>
            {drugEntries.map((entry, index) => (
              <Box
                key={index}
                p={4}
                mb={3}
                border="1px solid"
                borderColor="#4a43a5"
                borderRadius="md"
                backgroundColor="#2e2a68"
              >
                <Flex gap={4} flexWrap="wrap" alignItems="flex-end">
                  <FormControl flex="1">
                    <FormLabel textColor="white">Drug</FormLabel>
                    <Select
                      color="white"
                      value={entry.drug}
                      onChange={(e) => handleDrugChange(index, 'drug', e.target.value)}
                      placeholder="Select drug"
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
                        },
                      }}
                    >
                      {drugOptions.map((drug, i) => (
                        <option key={i} value={drug}>{drug}</option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl flex="1">
                    <FormLabel textColor="white">Reaction</FormLabel>
                    <Select
                      color="white"
                      value={entry.reaction}
                      onChange={(e) => handleDrugChange(index, 'reaction', e.target.value)}
                      placeholder="Select reaction"
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
                        },
                      }}
                    >
                      <option value="better">Helped IBD Symptoms</option>
                      <option value="worse">Made IBD Symptoms Worse</option>
                      <option value="no_change">No change</option>
                    </Select>
                  </FormControl>

                  <IconButton
                    icon={<CloseIcon />}
                    size="sm"
                    onClick={() => removeDrugEntry(index)}
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
                </Flex>
              </Box>
            ))}

            <Button onClick={addDrugEntry} mt={2} borderRadius="full" colorScheme="purple" variant="outline">
              Add Drug
            </Button>

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

            <>
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
              onClick={onOpen}
              px={8}
              py={4}
              boxShadow="2xl"
            >
              Submit Form
            </Button>

            <Modal isOpen={isOpen} onClose={onClose} size="2xl">
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>User Agreement</ModalHeader>
                <ModalCloseButton borderRadius="full"/>
                <ModalBody>
                  <Text paddingBottom={4}>
                    Before you may use Virgil to retrieve information about medication for IBD, you must read and agree to the following statements. By checking these boxes, you confirm that you agree to the statements.
                  </Text>
                  <CheckboxGroup
                    value={agree}
                    onChange={(values) => setAgree(values)}
                  >
                  <Stack textAlign="left" spacing={4} direction="column">
                    <Checkbox colorScheme="purple" value="agree1">I understand that my Virgil report is for educational and research purposes only.</Checkbox>
                    <Checkbox colorScheme="purple" value="agree2">I understand that I am strongly encouraged to discuss my Virgil report with a doctor, genetic counselor or other health-care provider prior to making any medical decisions.</Checkbox>
                  </Stack>
                  </CheckboxGroup>
                </ModalBody>

                <ModalFooter>
                  <Button borderRadius="full" mr={3} variant="ghost" onClick={onClose}>
                    Close
                  </Button>
                  <Button borderRadius="full" colorScheme='green' onClick={handleUpload}>Agree and Submit Form</Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
            </>
          </VStack>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default UploadFilePage;
