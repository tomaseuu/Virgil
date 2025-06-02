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
  Link,
  AccordionItem, AccordionButton, AccordionPanel, AccordionIcon,
  FormControl, FormLabel, Input
} from '@chakra-ui/react';
import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Bubble from '../components/Bubble';
import SideNav from '../components/SideNav';
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

  const [doctorName, setDoctorName] = useState('');

  let nextStepsCheck = true;
  if (Object.keys(genes_and_snps).length === 0) {
    nextStepsCheck = false;
  }

  let meds = "";
  let altList = "";

  if (best_drug.length > 0) {
    const brandNames = best_drug.map(r => r["Brand Name"]);

    if (brandNames.length === 1) {
      meds = brandNames[0];
    } else if (brandNames.length === 2) {
      meds = `${brandNames[0]} and ${brandNames[1]}`;
    } else {
      meds = `${brandNames.slice(0, -1).join(", ")}, and ${brandNames[brandNames.length - 1]}`;
    }
  }

  if (alternatives.length > 0) {
    const altNames = alternatives.map(a => a["Brand Name"]);

    if (altNames.length === 1) {
      altList = altNames[0];
    } else if (altNames.length === 2) {
      altList = `${altNames[0]} and ${altNames[1]}`;
    } else {
      altList = `${altNames.slice(0, -1).join(", ")}, and ${altNames[altNames.length - 1]}`;
    }
  }

  function isDrugMatch(citationDrug, descDrug) {
    const citationDrugs = Array.isArray(citationDrug) ? citationDrug : [citationDrug];
    const descDrugs = Array.isArray(descDrug) ? descDrug : [descDrug];

    const normalizedCitationDrugs = citationDrugs.map(d => d.toLowerCase().trim());
    const normalizedDescDrugs = descDrugs.map(d => d.toLowerCase().trim());

    return normalizedDescDrugs.some(d => normalizedCitationDrugs.includes(d));
  }

  const formatNoteText = () => {
    let note = `Hi ${doctorName || "Doctor"},\n\nI recently used Virgil, an experimental platform that analyzes genetic information from 23andMe along with other health data to recommend targeted treatments for IBD patients.\n\n`;

    if (best_drug.length > 0) {
      note += `Based on my results, Virgil has recommended ${meds}. This treatment plan is predicted to be more effective in helping me achieve remission faster by targeting my specific genetic profile and disease characteristics.\n\n`;
    
      best_drug_description.forEach(desc => {
        const snpsRaw = genes_and_snps[desc['node']];
        const snps = snpsRaw && typeof snpsRaw === 'object' ? Object.keys(snpsRaw).join(", ") : "N/A";
        const citationObj = citations.find(c => isDrugMatch(c.best_drug, desc.drug));
        let citationURL = "No citation provided.";
        if (citationObj) {
          if (Array.isArray(citationObj.citation)) {
            citationURL = citationObj.citation.join(", ");
          } else {
            citationURL = citationObj.citation;
          }
        }

        note += `My 23andMe data shows a mutation affecting the ${desc.node} gene (SNPs: ${snps}). The best treatment for this mutation is ${desc.drug}. According to Virgil: ${desc.description} (Citation: ${citationURL}).\n\n`;
      });
    }

    note += `I would appreciate the opportunity to discuss this recommendation with you at our next appointment to understand if this medication could be suitable for my treatment plan.\n\n`;
    note += `Thank you for your time and guidance!\n`;

    return note;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const noteText = useMemo(() => formatNoteText(), [doctorName, best_drug, best_drug_description, genes_and_snps, citations]);
  const { onCopy } = useClipboard(noteText);
  const toast = useToast();

  function cleanText(input) {
    return input
      .replace(/[“”«»„]/g, '"')
      .replace(/[‘’‚‛]/g, "'")
      .replace(/[–—―]/g, '-')
      .replace(/[^\x20-\x7E\n\r]/g, ' ')
      .trim();
  }

const handleDownloadPDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const lineHeight = 8;
  let y = margin;

  const maxWidth = pageWidth - 2 * margin;

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text('Virgil IBD Summary', pageWidth / 2, y, { align: 'center' });

  y += lineHeight * 2;

  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  const today = new Date().toLocaleDateString();
  doc.text(today, margin, y);

  y += lineHeight * 2;

  doc.setFontSize(12);
  doc.setFont('times', 'normal');
  doc.setTextColor(0, 0, 0);

  const addJustifiedText = (text) => {
    const paragraphs = text.split(/\n\s*\n/);
    paragraphs.forEach((para) => {
      const lines = doc.splitTextToSize(para.trim(), maxWidth);
      lines.forEach((line) => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y, { align: 'justify', maxWidth });
        y += lineHeight;
      });
      y += lineHeight;
    });
  };

  addJustifiedText(cleanText(noteText.trim()));

  y += lineHeight * 2;
  doc.setFontSize(12);
  doc.setTextColor(120);
  doc.text('Generated via Virgil', margin, y);

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  doc.save('Virgil_IBD_Summary.pdf');

  toast({
    title: 'Download Started',
    description: 'Your PDF has been downloaded.',
    status: 'success',
    duration: 3000,
    isClosable: true,
  });
};

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <ChakraProvider>
      <Box minH="100vh" bg="#4134bb" display="flex" flexDirection="column" pb={10}>
        <NavBar />

        <SideNav scrollToSection={scrollToSection} />

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
              id="understanding"
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
                    Alternate Treatment
                  </Heading>

                  {alternatives && alternatives.length > 0 ? (
                    <Text mb={4} color="white" fontFamily="'Glacial Indifference Reg'">
                      Some alternate treatment(s) are {altList}.
                    </Text>
                  ) : (
                    <Text mb={4} color="white" fontFamily="'Glacial Indifference Reg'">
                      Due to the info you shared, alternate treatments are not recommended.
                    </Text>
                  )}
                </Box>

                <Text mt={3} color="white" fontStyle="italic" fontSize="sm">
                  * For detailed treatment/medication information, please check the <Link
                    onClick={() => scrollToSection('treatment')}
                    textDecoration="underline"
                    cursor="pointer"
                    color="white"
                    _hover={{ color: '#bdbdfd' }}
                  >
                    Treatment Information
                  </Link>{' '}
                  section below.
                </Text>
              </Box>
            </Box>


            {/* Next Steps Section */}
            <Box
              id="next-steps"
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

                <FormControl mb={4}>
                  <FormLabel color="white" fontFamily="'Glacial Indifference Reg'" fontWeight="bold">Enter your doctor's name to customize the note</FormLabel>
                  <Input
                    placeholder="e.g., Dr. Smith"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    bg="whiteAlpha.200"
                    color="white"
                    _placeholder={{ color: 'whiteAlpha.500' }}
                  />
                </FormControl>

                <Textarea
                  value={noteText}
                  readOnly
                  size="md"
                  height="160px"
                  mb={3}
                  bg="whiteAlpha.200"
                  color="white"
                  resize="vertical"
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
              id="treatment"
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
