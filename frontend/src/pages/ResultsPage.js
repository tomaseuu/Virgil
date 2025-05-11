import React from 'react';
import { ChakraProvider, Box, Heading, Text, VStack, Accordion } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Bubble from '../components/Bubble';

function ResultsPage() {
  const location = useLocation();
  const resultString = location.state?.results || '';

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="#4134bb" display="flex" flexDirection="column">
        <NavBar />

        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          px={10}
          pt="10vh"
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
              Results
            </Heading>

            {resultString && resultString.length > 0 ? (
            <Accordion allowToggle w="100%">
              {resultString.map((result, index) => (
                <Bubble key={index} results={result} />
              ))}
            </Accordion>
            ) : (
              <Text color="white" fontFamily="'Glacial Indifference Reg'">
                No results found
              </Text>
            )}
          </VStack>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default ResultsPage;