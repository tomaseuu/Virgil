import React from 'react';
import { ChakraProvider, Box, Heading, Text, Accordion, VStack } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Bubble from '../components/Bubble';

function ResultsPage() {
  const location = useLocation();
  const { results } = location.state || {};

  const formattedResults = results
    ? Object.keys(results).map((key) => ({
        polymorphism: key,
        description: results[key].description,
        genotype: results[key].genotype,
      }))
    : [];

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

            {formattedResults && formattedResults.length > 0 ? (
              <Accordion allowToggle w="100%">
                {formattedResults.map((result, index) => (
                  <Bubble
                    key={index}
                    polymorphism={result.polymorphism}
                    description={result.description}
                    genotype={result.genotype}
                  />
                ))}
              </Accordion>
            ) : (
              <Text color="white" fontFamily="'Glacial Indifference Reg'">No results found</Text>
            )}
          </VStack>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default ResultsPage;
