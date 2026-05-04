import React from 'react';
import { Box, Flex, Text, Button, Spacer, Image, HStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

function NavBar() {
  const navigate = useNavigate();

  return (
    <Box
      bg="#2e2a68"
      px={6}
      py={4}
      boxShadow="md"
      top={0}
      zIndex={10}
    >
      <Flex align="center">
        <HStack
          spacing={3}
          cursor="pointer"
          onClick={() => navigate('/')}
          transition="transform 0.25s ease"
          _hover={{ transform: 'translateY(-1px)' }}
        >
          <Image
            src="/Logo.png"
            alt="Virgil logo"
            boxSize={{ base: '38px', md: '46px' }}
            objectFit="contain"
            filter="drop-shadow(0 8px 18px rgba(0, 0, 0, 0.22))"
          />
          <Text
            fontSize="xl"
            color="white"
            fontWeight="bold"
            fontFamily="'Glacial Indifference Bold'"
            letterSpacing="0.08em"
          >
            VIRGIL
          </Text>
        </HStack>
        <Spacer />
        <Button
          variant="ghost"
          color="white"
          borderRadius="full"
          _hover={{
            bg: '#5c3cae',
            color: 'white',
            transform: 'scale(1.05)',
          }}
          _active={{
            bg: '#4a2f8d',
          }}
          fontFamily="'Glacial Indifference Bold'"
          fontWeight="bold"
          letterSpacing="1px"
          px={8}
          py={4}
          transition="all 0.3s ease"
          onClick={() => navigate('/uploadfile')}
        >
          Upload
        </Button>
      </Flex>
    </Box>
  );
}

export default NavBar;
