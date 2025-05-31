import {
  ChakraProvider,
  Box,
  Heading,
  Text,
  VStack,
  Accordion,
  Stack,
  Flex,
  IconButton,
  useClipboard,
  useToast,
  Tooltip,
  Textarea,
  SimpleGrid,
  AccordionItem, AccordionButton, AccordionPanel, AccordionIcon
} from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Bubble from '../components/Bubble';
import { CopyIcon, DownloadIcon } from '@chakra-ui/icons';
import jsPDF from 'jspdf';

function ResultsPage() {
  const location = useLocation();
  const results = location.state?.results || {};

  const best_drug = results.best_drug || [];
  const alternatives = results.alternatives || [];
  const genes_and_snps = results.genes_and_snps || {};
  const best_drug_description = results.best_drug_description || [];
  const citations = results.citations || [];

  let nextStepsCheck = true;
  if (Object.keys(genes_and_snps).length === 0) {
    nextStepsCheck = false;
  }

  const meds = best_drug.map(r => r["Brand Name"]).join(", ");
  const noteText = `Hi Doctor,

I recently used Virgil, an experimental platform that analyzes genetic information from 23andMe along with other health data to recommend targeted treatments for IBD patients. Based on my results, Virgil has recommended ${meds} because it is predicted to be more effective in helping me achieve remission faster by targeting my specific genetic profile and disease characteristics.

I would appreciate the opportunity to discuss this recommendation with you at our next appointment to understand if this medication could be suitable for my treatment plan.

Thank you for your time and guidance!`;
  const { onCopy } = useClipboard(noteText);
  const toast = useToast();

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    const lineHeight = 8;
    let y = 10;

    const addWrappedText = (text, fontSize = 12) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, 180);
      lines.forEach(line => {
        if (y > 280) {
          doc.addPage();
          y = 10;
        }
        doc.text(line, 15, y);
        y += lineHeight;
      });
      y += lineHeight / 2;
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Note to Doctor', 15, y);
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    addWrappedText(noteText);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Understanding Your Results', 15, y);
    y += lineHeight;

    doc.setFont('helvetica', 'normal');
    addWrappedText('Your results were chosen based on your unique genetic profile from 23andMe data combined with your health information and clinical research on IBD treatments.');
    addWrappedText('This tailored approach aims to help you achieve remission faster and improve your overall treatment outcomes.');
    addWrappedText('Please remember that these recommendations support discussions with your healthcare provider and are not a substitute for professional medical advice. We encourage you to share these results with your doctor to explore the best treatment options together.');
    addWrappedText('Expand the medication(s) below to see more specific information. All information is taken from fda.gov/drugs.');

    doc.save('Virgil_IBD_Results.pdf');

    toast({
      title: 'Download Started',
      description: 'Your PDF has been downloaded.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="#4134bb" display="flex" flexDirection="column" pb={10}>
        <NavBar />

        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
          px={[4, 6, 8]}
          pt="10vh"
          textAlign="center"
          maxW="90vw"
          mx="auto"
        >
          <VStack spacing={[6, 8]} maxW="100%" w="100%">
            <Heading
              size="2xl"
              color="white"
              fontFamily="'Glacial Indifference Bold'"
              textShadow="2px 2px 10px rgba(0, 0, 0, 0.3)"
            >
              Results
            </Heading>

            {/* Understanding Your Results Section */}
            <Box
              textAlign="left"
              width="100%"
              bg="#675cc4"
              padding={[6, 8]}
              borderRadius="md"
              boxShadow="lg"
              fontFamily="'Glacial Indifference Reg'"
            >
              <Heading
                size="md"
                color="white"
                fontFamily="'Glacial Indifference Bold'"
                mb={6}
                textAlign="center"
              >
                Understanding Your Results
              </Heading>

              {/* Genetic Variants and SNPs */}
              <Box mb={8}>
                <Heading
                  size="sm"
                  color="white"
                  fontFamily="'Glacial Indifference Bold'"
                  mb={4}
                >
                  Genetic Variants and SNPs
                </Heading>

                {!nextStepsCheck ? (
                  <Text mb={3} color="white">
                    No relevant SNPs were found in your 23andMe file.
                  </Text>
                ) : (
                Object.entries(genes_and_snps).map(([gene, snps]) => (
                  <Box key={gene} mb={6}>
                    <Text mb={3} color="white">
                      Your 23andMe data shows a mutation that affects the <b>{gene}</b> gene. The following SNPs were found:
                    </Text>

                    <SimpleGrid columns={[1, 2, 3]} spacing={6} width="100%">
                      {Object.entries(snps).map(([snp, desc]) => (
                        <Box
                          key={snp}
                          p={4}
                          borderRadius="md"
                          border="1px solid"
                          borderColor="whiteAlpha.300"
                          bg="rgba(255, 255, 255, 0.05)"
                        >
                          <Accordion allowToggle>
                            <AccordionItem border="none">
                              <AccordionButton px={2} py={0.25} color="purple.300">
                                <Box flex="1" textAlign="left" fontWeight="bold" color="purple.300">
                                  {snp}
                                </Box>
                                <AccordionIcon />
                              </AccordionButton>
                              <AccordionPanel pb={2} fontSize="sm" color="gray.200" whiteSpace="pre-wrap">
                                {desc}
                              </AccordionPanel>
                            </AccordionItem>
                          </Accordion>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </Box>
                ))
              )}
              </Box>

              {/* Treatment Recommendation */}
              <Box mb={8}>
                <Heading size="sm" color="white" fontFamily="'Glacial Indifference Bold'" mb={4}>
                  Treatment Recommendation
                </Heading>

                {/* Best Treatment */}
                <Box mb={6}>
                  <Heading size="sm" color="white" fontFamily="'Glacial Indifference Reg'" mb={3}>
                    Best Treatment
                  </Heading>

                  {best_drug_description && best_drug_description.length > 0 ? (
                    <SimpleGrid columns={[1, 2]} spacing={6} width="100%">
                      {best_drug_description.map(({ node, drug, description }, i) => {
                        const relatedCitations = citations.filter(c => {
                          const bestDrug = c.best_drug;
                          const bestDrugArr = Array.isArray(bestDrug) ? bestDrug : [bestDrug];
                          const drugArr = Array.isArray(drug) ? drug : [drug];
                          return drugArr.some(d => bestDrugArr.includes(d));
                        });

                        return (
                          <Box
                            key={i}
                            p={4}
                            borderRadius="md"
                            border="1px solid"
                            borderColor="whiteAlpha.300"
                            bg="rgba(255, 255, 255, 0.05)"
                          >
                            <Text mb={2} color="white">
                              {`Based on Virgil algorithms, the best treatment for your ${node} mutation ${
                                Array.isArray(drug)
                                  ? drug.length === 1
                                    ? 'is'
                                    : 'are'
                                  : 'is'
                              } `}
                              <b>{Array.isArray(drug) ? drug.join(", ") : drug}</b>.
                            </Text>

                            <Accordion allowToggle>
                              <AccordionItem border="none">
                                <AccordionButton px={0} fontWeight="bold" color="purple.300">
                                  <Box flex="1" textAlign="left" fontFamily="'Glacial Indifference Reg'">
                                    View description to learn more
                                  </Box>
                                  <AccordionIcon />
                                </AccordionButton>
                                <AccordionPanel pb={2} fontSize="sm" color="gray.200" whiteSpace="pre-wrap">
                                  {description}

                                  {relatedCitations.length > 0 && (
                                    <>
                                      <Text fontWeight="bold" mt={4} mb={2} color="white">
                                        Citations:
                                      </Text>
                                      {relatedCitations.map(({ citation }, idx) => (
                                        Array.isArray(citation) ? (
                                          citation.map((url, uidx) => (
                                            <Text
                                              key={`cit-${idx}-${uidx}`}
                                              fontSize="sm"
                                              color="purple.200"
                                              as="a"
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              display="block"
                                              mb={1}
                                              textDecoration="underline"
                                            >
                                              {url}
                                            </Text>
                                          ))
                                        ) : (
                                          <Text
                                            key={`cit-${idx}`}
                                            fontSize="xs"
                                            color="purple.200"
                                            as="a"
                                            href={citation}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            display="block"
                                            mb={1}
                                          >
                                            {citation}
                                          </Text>
                                        )
                                      ))}
                                    </>
                                  )}
                                </AccordionPanel>
                              </AccordionItem>
                            </Accordion>
                          </Box>
                        );
                      })}
                    </SimpleGrid>
                  ) : (
                    <Text mb={4} color="white" fontFamily="'Glacial Indifference Reg'">
                      Due to the info you shared, the best treatments are not recommended.
                    </Text>
                  )}
                </Box>

                {/* Alternative Treatment */}
                <Box>
                  <Heading size="sm" color="white" fontFamily="'Glacial Indifference Reg'" mb={3}>
                    Alternative Treatment
                  </Heading>

                  {alternatives && alternatives.length > 0 ? (
                    <Text mb={4} color="white" fontFamily="'Glacial Indifference Reg'">
                      Some alternative treatment(s) are {alternatives.map(a => a["Brand Name"]).join(", ")}.
                    </Text>
                  ) : (
                    <Text mb={4} color="white" fontFamily="'Glacial Indifference Reg'">
                      Due to the info you shared, alternative treatments are not recommended.
                    </Text>
                  )}
                </Box>

                <Text mt={3} color="white" fontStyle="italic" fontSize="sm">
                  * For detailed treatment/medication information, please check the Treatment Information section below.
                </Text>
              </Box>
            </Box>


            {/* Next Steps Section */}
            <Box
              textAlign="left"
              width="100%"
              bg="#675cc4"
              padding={[6, 8]}
              borderRadius="md"
              boxShadow="lg"
              fontFamily="'Glacial Indifference Reg'"
            >
              <Heading
                size="md"
                color="white"
                fontFamily="'Glacial Indifference Bold'"
                mb={6}
                textAlign="center"
              >
                Next Steps
              </Heading>

              {!nextStepsCheck ? (
                <Stack spacing={4}>
                  <Text color="white" fontFamily="'Glacial Indifference Reg'" whiteSpace="pre-wrap">
                    Unfortunately, since no relevant SNPs were found in your 23andMe file, the Virgil algorithm is unable to give you a recommended treatment plan.
                  </Text>

                  <Text color="white" fontFamily="'Glacial Indifference Reg'" whiteSpace="pre-wrap">
                    No next steps are available at this time.
                  </Text>
                </Stack>
              ) : (
              <>
              {/* Disclaimer */}
              <Box pb={6}>
                <Stack spacing={4}>
                  <Text color="white" fontFamily="'Glacial Indifference Reg'" whiteSpace="pre-wrap">
                    Now that you have this information, we recommend sharing it with your doctor. Below is a note you can <b>copy</b> or <b>download</b> to bring to your next appointment.
                  </Text>

                  <Text color="white" fontFamily="'Glacial Indifference Reg'" whiteSpace="pre-wrap">
                    Your personalized medication recommendations were generated by analyzing your unique genetic profile from your 23andMe data, combined with your health information and clinical research on IBD treatments. This tailored approach aims to help you achieve remission faster and improve your overall treatment outcomes.
                  </Text>

                  <Text pt={2} color="white" fontFamily="'Glacial Indifference Reg'" whiteSpace="pre-wrap">
                    Please remember that these recommendations are meant to support discussions with your healthcare provider. They are not a substitute for professional medical advice. We encourage you to share these results with your doctor to explore the best treatment options together.
                  </Text>
                </Stack>
              </Box>

              {/* Note to Doctor */}
              <Box mb={8}>
                <Heading size="sm" color="white" fontFamily="'Glacial Indifference Bold'" mb={3}>
                  Note to Doctor
                </Heading>

                <Textarea
                  value={noteText}
                  readOnly
                  size="md"
                  height="160px"
                  resize="none"
                  mb={3}
                  bg="whiteAlpha.200"
                  color="white"
                />
                <Flex justifyContent="flex-end" gap={4}>
                  <Tooltip label="Copy to clipboard" placement="top">
                    <IconButton
                      aria-label="Copy note text"
                      icon={<CopyIcon />}
                      onClick={() => {
                        onCopy();
                        toast({
                          title: 'Copied',
                          description: 'Note copied to clipboard',
                          status: 'success',
                          duration: 2000,
                          isClosable: true,
                        });
                      }}
                      colorScheme="gray"
                      size="sm"
                    />
                  </Tooltip>

                  <Tooltip label="Download as PDF" placement="top">
                    <IconButton
                      aria-label="Download PDF"
                      icon={<DownloadIcon />}
                      onClick={handleDownloadPDF}
                      colorScheme="gray"
                      size="sm"
                    />
                  </Tooltip>
                </Flex>
              </Box>
              </>
              )}
            </Box>

            {/* Treatment Information Section */}
            <Box
              textAlign="left"
              width="100%"
              bg="#675cc4"
              padding={[6, 8]}
              borderRadius="md"
              boxShadow="lg"
              fontFamily="'Glacial Indifference Reg'"
            >
              <Box mb={8}>
                <Heading
                  size="md"
                  color="white"
                  fontFamily="'Glacial Indifference Bold'"
                  mb={6}
                  textAlign="center"
                >
                  Treatment Information
                </Heading>

              {nextStepsCheck && (
                <Text pb={4} color="white" fontFamily="'Glacial Indifference Reg'">
                  Expand the treatment(s) below to see more specific information. All information is taken from{' '}
                  <Text
                    fontSize="sm"
                    color="white"
                    as="a"
                    href="https://www.fda.gov/drugs"
                    target="_blank"
                    rel="noopener noreferrer"
                    mb={1}
                    textDecoration="underline"
                  >
                    fda.gov/drugs
                  </Text>
                  .
                </Text>
                )} 
                <>
                {best_drug && best_drug.length > 0 ? (
                  <>
                    <Text color="white" mb={4} fontFamily="'Glacial Indifference Bold'">
                      Best Treatment
                    </Text>
                    <Accordion allowToggle w="100%">
                      {best_drug.map((result, index) => (
                        <Bubble key={index} results={result} />
                      ))}
                    </Accordion>
                  </>
                ) : (
                  <Text color="white" fontFamily="'Glacial Indifference Reg'">
                    No best treatment(s) found.
                  </Text>
                )}

                {alternatives && alternatives.length > 0 ? (
                  <>
                    <Text color="white" mb={4} fontFamily="'Glacial Indifference Bold'">
                      Alternate Treatment
                    </Text>
                    <Accordion allowToggle w="100%">
                      {alternatives.map((result, index) => (
                        <Bubble key={index} results={result} />
                      ))}
                    </Accordion>
                  </>
                ) : (
                  <Text color="white" fontFamily="'Glacial Indifference Reg'">
                    No alternate treatment(s) found.
                  </Text>
                )}
              </>
              </Box>
              </Box>
          </VStack>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default ResultsPage;