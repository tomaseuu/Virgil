import React, { useState } from 'react';
import { ChakraProvider, Box, Heading, Text, Button, Input, VStack, HStack, IconButton } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import axios from 'axios';

function UploadFilePage() {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleRemoveFile = () => {
    setFile(null);
    document.getElementById('file-upload').value = null;
  };

  const handleUpload = async () => {
    if (!file) return alert('No file selected!');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error) {
      console.error(error);
      alert('Upload failed');
    }
  };

  return (
    <ChakraProvider>
      <Box
        minH="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
        bg="#4134bb"
        px={4}
      >
        <VStack spacing={6}>
          <Heading size="2xl" textAlign="center" color="#ffffff">
            Upload Your File
          </Heading>

          <Text fontSize="xl" color="#ffffff">
            Upload your 23andMe results to get started.
          </Text>

          <Box>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              display="none"
            />
            <label htmlFor="file-upload">
              <Button
                as="span"
                bg="#5c3cae"
                color="white"
                borderRadius="full"
                _hover={{ bg: '#4a2f8d' }}
              >
                {file ? 'Change File' : 'Choose File'}
              </Button>
            </label>
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
                color="red"
              />
            </HStack>
          )}

          <Button
            _hover={{ bg: '#4a2f8d' }}
            borderRadius="full"
            color="white"
            bg="#5c3cae"
            size="lg"
            onClick={handleUpload}
          >
            Upload File
          </Button>
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

export default UploadFilePage;
