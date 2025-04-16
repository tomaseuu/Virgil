import React from 'react';
import { ChakraProvider, Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import '../index.css';

function App() {
  const navigate = useNavigate();

  const goToFile = () => {
    navigate('/uploadfile');
  };

  return (
    <ChakraProvider>
      <Box
        minH="100vh"
        bgGradient="linear(to-r, #4134bb, #6c49bb)"
        backgroundSize="cover"
        backgroundPosition="center"
        display="flex"
        flexDirection="column"
      >
        <NavBar />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          px={10}
          pt="20vh"
          textAlign="center"
          maxW="lg"
          mx="auto"
        >
          <VStack spacing={8}>
            <Heading
              size="2xl"
              color="white"
              fontFamily="'Glacial Indifference Bold'"
              textShadow="2px 2px 10px rgba(0, 0, 0, 0.3)"
            >
              Welcome to VIRGIL
            </Heading>

            <Text
              fontSize="xl"
              color="white"
              fontFamily="'Glacial Indifference Reg'"
              letterSpacing="1px"
              fontWeight="light"
              maxW="xl"
            >
              Guiding patients out of darkness.
            </Text>

            <Button
              _hover={{ bg: '#4a2f8d', transform: 'scale(1.05)', boxShadow: 'xl' }}
              _active={{ bg: '#3b267d' }}
              borderRadius="full"
              color="white"
              bg="#5c3cae"
              size="lg"
              fontFamily="'Glacial Indifference Reg'"
              fontWeight="bold"
              letterSpacing="1px"
              onClick={goToFile}
              boxShadow="2xl"
            >
              Get Started
            </Button>
          </VStack>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;
