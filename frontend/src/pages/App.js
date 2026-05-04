import React, { useEffect, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  ChakraProvider,
  FormControl,
  Grid,
  GridItem,
  Heading,
  HStack,
  Image,
  Input,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentProfile } from '../lib/profile';
import '../index.css';

function getStatusTone(status) {
  const normalized = status.toLowerCase();

  if (normalized.includes('failed') || normalized.includes('no profile')) {
    return {
      bg: 'rgba(122, 39, 70, 0.55)',
      border: 'rgba(255, 173, 173, 0.35)',
      color: '#ffe3e3',
    };
  }

  if (normalized.includes('connected') || normalized.includes('signed in')) {
    return {
      bg: 'rgba(26, 82, 68, 0.55)',
      border: 'rgba(157, 255, 220, 0.28)',
      color: '#d8fff2',
    };
  }

  return {
    bg: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.15)',
    color: 'rgba(255, 255, 255, 0.86)',
  };
}

function App() {
  const navigate = useNavigate();
  const { session, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      if (!user?.id) {
        setStatus('');
        return;
      }

      setStatus('Loading profile...');

      try {
        const currentProfile = await getCurrentProfile(user.id);
        if (ignore) return;

        if (currentProfile) {
          setStatus('Connected to shared Supabase and profile found.');
        } else {
          setStatus('Signed in, but no profile row exists for this auth user yet.');
        }
      } catch (error) {
        if (ignore) return;
        setStatus(`Profile lookup failed: ${error.message}`);
      }
    };

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [user?.id]);

  const handleSignIn = async (event) => {
    event.preventDefault();
    setStatus('Signing in...');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus(`Sign in failed: ${error.message}`);
      return;
    }

    setStatus('Signed in.');
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setStatus(`Sign out failed: ${error.message}`);
      return;
    }

    setStatus('Signed out.');
  };

  const goToFile = () => {
    navigate('/uploadfile');
  };

  const statusTone = getStatusTone(status || 'idle');

  return (
    <ChakraProvider>
      <Box
        minH="100vh"
        position="relative"
        overflow="hidden"
        bg="linear-gradient(145deg, #19163d 0%, #352d82 36%, #4f3ab0 100%)"
      >
        <Box
          position="absolute"
          inset="0"
          bg="radial-gradient(circle at top left, rgba(157, 130, 255, 0.34), transparent 34%), radial-gradient(circle at bottom right, rgba(114, 212, 255, 0.14), transparent 28%)"
        />
        <Box
          position="absolute"
          top="-8rem"
          right="-6rem"
          w="22rem"
          h="22rem"
          borderRadius="full"
          bg="rgba(145, 115, 255, 0.22)"
          filter="blur(14px)"
        />
        <Box
          position="absolute"
          bottom="-10rem"
          left="-7rem"
          w="24rem"
          h="24rem"
          borderRadius="full"
          bg="rgba(70, 215, 255, 0.14)"
          filter="blur(18px)"
        />

        <Box position="relative" zIndex="1">
          <NavBar />

          <Grid
            templateColumns={{ base: '1fr', lg: 'minmax(0, 1.15fr) minmax(360px, 440px)' }}
            gap={{ base: 10, lg: 12 }}
            alignItems="center"
            minH="calc(100vh - 80px)"
            px={{ base: 6, md: 10, xl: 20 }}
            py={{ base: 10, md: 14 }}
          >
            <GridItem>
              <VStack align={{ base: 'center', lg: 'start' }} spacing={8} textAlign={{ base: 'center', lg: 'left' }}>
                <Box
                  p={{ base: 3, md: 4 }}
                  borderRadius="28px"
                  bg="rgba(255, 255, 255, 0.08)"
                  border="1px solid rgba(255, 255, 255, 0.12)"
                  boxShadow="0 16px 40px rgba(14, 10, 42, 0.22)"
                >
                  <Image
                    src="/Logo.png"
                    alt="Virgil logo"
                    h={{ base: '82px', md: '112px', xl: '128px' }}
                    objectFit="contain"
                    filter="drop-shadow(0 10px 22px rgba(16, 10, 46, 0.24))"
                  />
                </Box>

                <Badge
                  px={4}
                  py={2}
                  borderRadius="full"
                  bg="rgba(255, 255, 255, 0.12)"
                  color="white"
                  fontSize="0.78rem"
                  letterSpacing="0.18em"
                  textTransform="uppercase"
                  border="1px solid rgba(255, 255, 255, 0.16)"
                >
                  Precision IBD Guidance
                </Badge>

                <Stack spacing={5} maxW={{ base: '100%', lg: '720px' }}>
                  <Heading
                    color="white"
                    fontFamily="'Glacial Indifference Bold'"
                    fontSize={{ base: '3.25rem', md: '4.5rem', xl: '5.6rem' }}
                    lineHeight={{ base: 0.95, md: 0.93 }}
                    letterSpacing="-0.04em"
                    textShadow="0 18px 45px rgba(14, 10, 42, 0.35)"
                  >
                    Welcome to VIRGIL
                  </Heading>

                  <Text
                    fontSize={{ base: 'lg', md: 'xl' }}
                    color="rgba(241, 240, 255, 0.84)"
                    fontFamily="'Glacial Indifference Reg'"
                    letterSpacing="0.02em"
                    maxW="640px"
                    lineHeight="1.7"
                  >
                    Genetic insight, treatment context, and a clearer starting point for more informed IBD conversations.
                  </Text>
                </Stack>

                <HStack spacing={4} flexWrap="wrap" justify={{ base: 'center', lg: 'flex-start' }}>
                  <Button
                    onClick={goToFile}
                    size="lg"
                    px={9}
                    h="58px"
                    borderRadius="full"
                    bg="white"
                    color="#2b236b"
                    fontFamily="'Glacial Indifference Bold'"
                    fontSize="md"
                    letterSpacing="0.04em"
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: '0 18px 36px rgba(16, 10, 46, 0.24)',
                    }}
                    _active={{ transform: 'translateY(0)' }}
                  >
                    Get Started
                  </Button>

                  <Badge
                    px={4}
                    py={2.5}
                    borderRadius="full"
                    bg="rgba(16, 10, 46, 0.26)"
                    color="rgba(255, 255, 255, 0.82)"
                    border="1px solid rgba(255, 255, 255, 0.12)"
                    fontWeight="normal"
                    fontSize="0.9rem"
                  >
                    Guiding patients out of darkness.
                  </Badge>
                </HStack>
              </VStack>
            </GridItem>

            <GridItem>
              <Box
                bg="rgba(12, 10, 36, 0.42)"
                border="1px solid rgba(255, 255, 255, 0.12)"
                borderRadius="28px"
                p={{ base: 6, md: 8 }}
                boxShadow="0 24px 70px rgba(12, 8, 35, 0.32)"
                backdropFilter="blur(18px)"
              >
                <Stack spacing={6}>
                  <Stack spacing={2}>
                    <Badge
                      alignSelf="flex-start"
                      px={3}
                      py={1.5}
                      borderRadius="full"
                      bg="rgba(255, 255, 255, 0.12)"
                      color="white"
                      textTransform="uppercase"
                      letterSpacing="0.14em"
                      fontSize="0.72rem"
                    >
                      Workspace Access
                    </Badge>

                    <Heading
                      size="lg"
                      color="white"
                      fontFamily="'Glacial Indifference Bold'"
                    >
                      {session ? 'Ready to continue' : 'Sign in to your workspace'}
                    </Heading>

                    <Text color="rgba(236, 233, 255, 0.78)" fontSize="md">
                      {loading
                        ? 'Loading your session now.'
                        : session
                          ? `Signed in as ${user?.email}`
                          : 'Use your shared Virgil account to continue into uploads and results.'}
                    </Text>
                  </Stack>

                  {session ? (
                    <Stack spacing={4}>
                      <Box
                        borderRadius="22px"
                        border="1px solid rgba(255, 255, 255, 0.1)"
                        bg="rgba(255, 255, 255, 0.08)"
                        p={5}
                      >
                        <Stack spacing={2}>
                          <Text color="rgba(255, 255, 255, 0.62)" fontSize="sm" textTransform="uppercase" letterSpacing="0.12em">
                            Active Session
                          </Text>
                          <Text color="white" fontSize="lg" fontFamily="'Glacial Indifference Bold'">
                            {user?.email}
                          </Text>
                        </Stack>
                      </Box>

                      <Stack spacing={3}>
                        <Button
                          onClick={goToFile}
                          h="54px"
                          borderRadius="18px"
                          bg="white"
                          color="#261f62"
                          fontFamily="'Glacial Indifference Bold'"
                          _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
                        >
                          Continue to Upload
                        </Button>
                        <Button
                          onClick={handleSignOut}
                          h="54px"
                          borderRadius="18px"
                          variant="outline"
                          borderColor="rgba(255, 255, 255, 0.24)"
                          color="white"
                          _hover={{ bg: 'rgba(255, 255, 255, 0.08)' }}
                        >
                          Sign Out
                        </Button>
                      </Stack>
                    </Stack>
                  ) : (
                    <form onSubmit={handleSignIn}>
                      <Stack spacing={4}>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            h="54px"
                            borderRadius="18px"
                            borderColor="rgba(255, 255, 255, 0.12)"
                            bg="rgba(255, 255, 255, 0.08)"
                            color="white"
                            _placeholder={{ color: 'rgba(255, 255, 255, 0.46)' }}
                            _hover={{ borderColor: 'rgba(255, 255, 255, 0.22)' }}
                            _focus={{
                              borderColor: '#c1b4ff',
                              boxShadow: '0 0 0 1px rgba(193, 180, 255, 0.55)',
                            }}
                          />
                        </FormControl>

                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            h="54px"
                            borderRadius="18px"
                            borderColor="rgba(255, 255, 255, 0.12)"
                            bg="rgba(255, 255, 255, 0.08)"
                            color="white"
                            _placeholder={{ color: 'rgba(255, 255, 255, 0.46)' }}
                            _hover={{ borderColor: 'rgba(255, 255, 255, 0.22)' }}
                            _focus={{
                              borderColor: '#c1b4ff',
                              boxShadow: '0 0 0 1px rgba(193, 180, 255, 0.55)',
                            }}
                          />
                        </FormControl>

                        <Button
                          type="submit"
                          h="54px"
                          borderRadius="18px"
                          bg="white"
                          color="#261f62"
                          fontFamily="'Glacial Indifference Bold'"
                          _hover={{ transform: 'translateY(-1px)', boxShadow: 'lg' }}
                        >
                          Sign In
                        </Button>
                      </Stack>
                    </form>
                  )}

                  {status && (
                    <Box
                      borderRadius="20px"
                      px={4}
                      py={3.5}
                      bg={statusTone.bg}
                      border={`1px solid ${statusTone.border}`}
                    >
                      <Text color={statusTone.color} fontSize="sm" lineHeight="1.6">
                        {status}
                      </Text>
                    </Box>
                  )}
                </Stack>
              </Box>
            </GridItem>
          </Grid>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;
