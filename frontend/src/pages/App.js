import React, { useEffect, useState } from 'react';
import { ChakraProvider, Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentProfile } from '../lib/profile';
import '../index.css';

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

  return (
    <ChakraProvider>
      <Box
        minH="100vh"
        bgGradient="linear(to-r, #4134bb, #6c49bb)"
        backgroundSize="cover"
        backgroundPosition="center"
        display="flex"
        flexDirection="column"
      >
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
          <div style={{ padding: 16, marginBottom: 24, border: '1px solid #ddd', borderRadius: 12, background: 'white', width: '100%', textAlign: 'left' }}>
            <h2>Sign In</h2>
            <p>
              {loading
                ? 'Loading session...'
                : session
                  ? `Signed in as ${user?.email}`
                  : 'Signed out'}
            </p>

            {session ? (
              <div style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
                <button type="button" onClick={goToFile}>Continue to Upload</button>
                <button type="button" onClick={handleSignOut}>Sign Out</button>
              </div>
            ) : (
              <form onSubmit={handleSignIn} style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button type="submit">Sign In</button>
              </form>
            )}

            <p>{status}</p>
          </div>

          <VStack spacing={8}>
            <Heading
              size="2xl"
              color="white"
              fontFamily="'Glacial Indifference Bold'"
              textShadow="2px 2px 10px rgba(0, 0, 0, 0.3)"
            >
              Welcome to VIRGIL
            </Heading>

            <Text
              fontSize="xl"
              color="white"
              fontFamily="'Glacial Indifference Reg'"
              letterSpacing="1px"
              fontWeight="light"
              maxW="xl"
            >
              Guiding patients out of darkness.
            </Text>

            <Button
              _hover={{ bg: '#4a2f8d', transform: 'scale(1.05)', boxShadow: 'xl' }}
              _active={{ bg: '#3b267d' }}
              borderRadius="full"
              color="white"
              bg="#5c3cae"
              size="lg"
              fontFamily="'Glacial Indifference Reg'"
              fontWeight="bold"
              letterSpacing="1px"
              onClick={goToFile}
              boxShadow="2xl"
            >
              Get Started
            </Button>
          </VStack>
        </Box>
      </Box>
    </ChakraProvider>
  );
}

export default App;
