import {
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Text,
  Divider,
  Icon,
} from '@chakra-ui/react';
import {
  InfoOutlineIcon,
  WarningTwoIcon,
  StarIcon,
} from '@chakra-ui/icons';

const Section = ({ icon, title, content }) => (
  <Box>
    <Box display="flex" alignItems="center" mb={1}>
      <Icon as={icon} color="blue.200" mr={2} />
      <Text fontWeight="bold" color="whiteAlpha.900" fontSize="md">
        {title}:
      </Text>
    </Box>
    <Text fontSize="sm" color="whiteAlpha.800" whiteSpace="pre-wrap">
      {content || "N/A"}
    </Text>
    <Divider my={3} borderColor="whiteAlpha.300" />
  </Box>
);

function Bubble({ results }) {
  return (
    <AccordionItem
      border="none"
      mb={4}
      borderRadius="md"
      overflow="hidden"
      bg="#2c256e"
    >
      <h2>
        <AccordionButton
          _expanded={{
            bg: "#5043c3",
            color: "white",
            borderBottomRadius: 0,
          }}
          bg="#2c256e"
          color="white"
          fontFamily="'Glacial Indifference Bold'"
          px={6}
          py={4}
          w="100%"
          textAlign="left"
          justifyContent="space-between"
          borderTopRadius="md"
          borderBottomRadius="md"
        >
          <Box flex="1" fontSize="lg">
            {results["Brand Name"]}
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </h2>

      <AccordionPanel
        px={6}
        py={4}
        bg="#3b3192"
        color="white"
        fontFamily="'Glacial Indifference Reg'"
        w="100%"
        borderBottomRadius="md"
      >
        <Box>
          <Section icon={StarIcon} title="Active Ingredients" content={results["Active Ingredients"]} />
          <Section icon={InfoOutlineIcon} title="Dosage Form" content={results["Dosage Form"]} />
          <Section icon={InfoOutlineIcon} title="Route" content={results["Route"]} />
          <Section icon={InfoOutlineIcon} title="Prescription Status" content={results["Prescription Status"]} />
          <Section icon={InfoOutlineIcon} title="Indications and Usage" content={results["Indications and Usage"]} />
          {/* <Section icon={TimeIcon} title="Adverse Reactions" content={results["Adverse Reactions"]} /> */}
          <Section icon={WarningTwoIcon} title="Warnings" content={results["Warnings"]} />
          <Section icon={WarningTwoIcon} title="Boxed Warning" content={results["Boxed Warning"]} />
          {/* <Section icon={AttachmentIcon} title="Dosage and Administration" content={results["Dosage and Administration"]} /> */}
        </Box>
      </AccordionPanel>
    </AccordionItem>
  );
}

export default Bubble;