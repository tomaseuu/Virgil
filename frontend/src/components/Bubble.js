import React from 'react';
import { AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Box, Text } from '@chakra-ui/react';

function Bubble({ polymorphism, description, genotype }) {
  return (
    <AccordionItem border="none">
      <h2>
        <AccordionButton
          _expanded={{
            bg: "#5f4b8b",
            color: "white",
          }}
          bg="#4134bb"
          color="white"
          fontFamily="'Glacial Indifference Bold'"
          borderRadius="20px"
          px={6}
          py={4}
          mb={3}
          textAlign="left"
          w="100%"
        >
          <Box flex="1" textAlign="left" fontSize="lg">
            {polymorphism}
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>
      <AccordionPanel
        pb={4}
        bg="#5f4b8b"
        borderRadius="20px"
        color="white"
        fontFamily="'Glacial Indifference Reg'"
        px={6}
        py={4}
        w="100%"
      >
        <Text fontSize="md"><strong>Description:</strong> {description}</Text>
        <Text fontSize="md"><strong>Genotype:</strong> {genotype}</Text>
      </AccordionPanel>
    </AccordionItem>
  );
}

export default Bubble;
