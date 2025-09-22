'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Container,
  Icon,
} from '@chakra-ui/react';
import { FaFilePdf, FaFileWord } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HeaderNav from '@/components/HeaderNav';
import { Document } from '@/types';

export default function HomePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        // In a production system, this would make an API call to fetch all docs from the db
        // For this take home, I'm hardcoding the single document we have
        const documents: Document[] = [
          {
            docType: 'pdf',
            title: 'laws.pdf',
            numPages: 2,
          },
        ];

        setDocuments(documents);
      } catch (error) {
        console.error('Error loading documents:', error);
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    // Simulate loading delay
    setTimeout(() => {
      loadDocuments();
    }, 100);
  }, []);

  const handleRowClick = (document: Document) => {
    router.push(`/view?name=${encodeURIComponent(document.title)}`);
  };

  if (loading) {
    return (
      <VStack spacing={0} align="stretch" minH="100vh">
        <HeaderNav signOut={() => {}} onNewConversation={() => {}} />
        <Container maxW="6xl" py={8}>
          <VStack spacing={4}>
            <Spinner size="lg" color="blue.500" />
            <Text>Loading documents...</Text>
          </VStack>
        </Container>
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack spacing={0} align="stretch" minH="100vh">
        <HeaderNav signOut={() => {}} onNewConversation={() => {}} />
        <Container maxW="6xl" py={8}>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        </Container>
      </VStack>
    );
  }

  return (
    <VStack spacing={0} align="stretch" minH="100vh">
      <HeaderNav signOut={() => {}} onNewConversation={() => {}} />
      <Container maxW="6xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Box>
            <Text fontSize="2xl" fontWeight="bold" mb={2}>
              Legal Documents
            </Text>
            <Text color="gray.600">Browse through all legal documents</Text>
          </Box>

          <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
            {documents.map((doc, index) => (
              <HStack
                key={`${doc.title}-${index}`}
                p={3}
                cursor="pointer"
                transition="background-color 0.15s"
                _hover={{
                  bg: 'blue.50',
                }}
                borderBottomWidth={index < documents.length - 1 ? '1px' : '0'}
                borderBottomColor="gray.200"
                onClick={() => handleRowClick(doc)}
                spacing={4}
                align="center"
              >
                {/* File type icon */}
                <Box
                  w={8}
                  h={8}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {doc.docType === 'pdf' ? (
                    <Icon as={FaFilePdf} color="red.500" boxSize={6} />
                  ) : (
                    <Icon as={FaFileWord} color="blue.500" boxSize={6} />
                  )}
                </Box>

                {/* Document title */}
                <VStack align="start" spacing={1} flex={1}>
                  <Text fontWeight="medium" fontSize="sm">
                    {doc.title}
                  </Text>
                  <Text color="gray.500" fontSize="xs">
                    {doc.docType.toUpperCase()} file
                  </Text>
                </VStack>

                {/* Pages info */}
                <Text
                  color="gray.500"
                  fontSize="sm"
                  minW="80px"
                  textAlign="right"
                >
                  {doc.numPages} pages
                </Text>
              </HStack>
            ))}
          </Box>

          {documents.length === 0 && (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">No documents found</Text>
            </Box>
          )}
        </VStack>
      </Container>
    </VStack>
  );
}
