import { Tooltip } from '@chakra-ui/react';
import { Box, Button, IconButton, VStack, useDisclosure } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

function SideNav({ scrollToSection }) {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });

  const sidebarWidth = 'clamp(13.75rem, 20vw, 17.5rem)';
  const toggleBtnSize = '3rem';

  return (
    <>
    <Tooltip label="Quick Navigation" placement="left" openDelay={300}>
      <IconButton
        icon={isOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        onClick={onToggle}
        position="fixed"
        top="20vh"
        right={isOpen ? sidebarWidth : 0}
        zIndex={9999}
        aria-label={isOpen ? 'Close side nav' : 'Open side nav'}
        bg="#2e2a68"
        color="white"
        _hover={{ bg: '#4b47a3' }}
        borderRadius="1.25rem 0 0 1.25rem"
        boxShadow="md"
        width={toggleBtnSize}
        height={toggleBtnSize}
        minW={toggleBtnSize}
        minH={toggleBtnSize}
      />
      </Tooltip>

      <Box
        position="fixed"
        top="20vh"
        right={isOpen ? 0 : `calc(-1 * ${sidebarWidth})`}
        width={sidebarWidth}
        height="60vh"
        bg="#2e2a68"
        color="white"
        boxShadow="lg"
        borderRadius="0 0 0 1.25rem"
        transition="right 0.3s ease"
        zIndex={9998}
        overflow="hidden"
        px={6}
        py={8}
      >
        <Box
          fontWeight="bold"
          fontSize="xl"
          mb={6}
          textAlign="left"
          userSelect="none"
        >
          Quick Navigation
        </Box>

        <VStack spacing={6} mt={0} align="stretch">
          {[
            { label: 'Understanding Your Results', id: 'understanding' },
            { label: 'Next Steps', id: 'next-steps' },
            { label: 'Treatment Information', id: 'treatment' },
          ].map(({ label, id }) => (
            <Button
              key={id}
              onClick={() => scrollToSection(id)}
              variant="ghost"
              colorScheme="whiteAlpha"
              width="100%"
              justifyContent="flex-start"
              fontWeight="semibold"
              fontSize="md"
              _hover={{ bg: '#4b47a3' }}
              whiteSpace="normal"
              textAlign="left"
            >
              {label}
            </Button>
          ))}
        </VStack>
      </Box>
    </>
  );
}

export default SideNav;
