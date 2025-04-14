import React from 'react';
import { ChakraProvider, Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  const goToFile = () => {
    navigate('/uploadfile');
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
            Welcome to Virgil
          </Heading>

          <Text fontSize="xl" color="#ffffff">
            Guiding patients out of darkness
          </Text>

          <Button
            _hover={{ bg: '#4a2f8d' }}
            borderRadius="full"
            color="white"
            bg="#5c3cae"
            size="lg"
            onClick={goToFile}
          >
            Get Started
          </Button>
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

export default App;
