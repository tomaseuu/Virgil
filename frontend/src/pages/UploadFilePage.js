import React, { useState, useRef } from 'react';
import { ChakraProvider, Box, Heading, Text, Button, Input, VStack, HStack, IconButton } from '@chakra-ui/react';
import { CloseIcon, DownloadIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';

function UploadFilePage() {
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

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="#4134bb" display="flex" flexDirection="column">
        <NavBar />
        <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column" px={10} pt="20vh" textAlign="center" maxW="lg" mx="auto">
          <VStack spacing={8}>
            <Heading size="2xl" color="white" fontFamily="'Glacial Indifference Bold'" textShadow="2px 2px 10px rgba(0, 0, 0, 0.3)">
              Upload Your File
            </Heading>

            <Text fontSize="xl" color="white" fontFamily="'Glacial Indifference Reg'" letterSpacing="1px" fontWeight="light" maxW="xl">
              Upload your 23andMe results to get started.
            </Text>

            <Box>
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
                color="#a28df0"
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
                {file ? 'Change File' : 'Choose File'}
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
              Upload File
            </Button>
          </VStack>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default UploadFilePage;
