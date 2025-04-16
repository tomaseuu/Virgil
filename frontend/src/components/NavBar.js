import React from 'react';
import { Box, Flex, Text, Button, Spacer } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

function NavBar() {
  const navigate = useNavigate();

  return (
    <Box
      bg="#2e2a68"
      px={6}
      py={4}
      boxShadow="md"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex align="center">
        <Text
          fontSize="xl"
          color="white"
          fontWeight="bold"
          fontFamily="'Glacial Indifference Bold'"
          cursor="pointer"
          _hover={{
            color: '#5c3cae',
            transform: 'scale(1.05)',
          }}
          transition="all 0.3s ease-in-out"
          onClick={() => navigate('/')}
        >
          VIRGIL
        </Text>
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
