import { useState, useEffect, useRef } from 'react';
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
  const [IBD, setIBD] = useState('');
  const [pregnant, setPregnant] = useState('');
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

      const results = {
        best_drug: response.data.best_drug || [],
        alternatives: response.data.alternatives || [],
        genes_and_snps: response.data.genes_and_snps || {},
        best_drug_description: response.data.best_drug_description || [],
        citations: response.data.citations || [],
      };
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
                    <Checkbox colorScheme="purple" value="agree2">I understand that I am strongly encouraged to discuss my Virgil report with a doctor, genetic counselor, or other health-care provider prior to making any medical decisions.</Checkbox>
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
