'use client';

import { useSearchParams } from 'next/navigation';
import { Box, Container, Text, HStack, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import HeaderNav from '@/components/HeaderNav';
import Chat from '@/components/Chat';
import CitationPanel from '@/components/CitationPanel';
import dynamic from 'next/dynamic';
import { Citation } from '@/types';

// Dynamically import so it only runs on the client
const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
  ssr: false,
});

export default function ViewPage() {
  const searchParams = useSearchParams();
  const fileName = searchParams.get('name');
  const [isChatOpen, setIsChatOpen] = useState(true); // Auto-open chat panel
  const [citations, setCitations] = useState<Citation[]>([]);
  const [showCitations, setShowCitations] = useState(false);
  const [highlightedCitations, setHighlightedCitations] =
    useState<Citation | null>();

  const handleNewConversation = () => {
    setIsChatOpen(true);
  };

  const handleCitationsUpdate = (newCitations: Citation[]) => {
    setCitations(newCitations);
    setShowCitations(newCitations.length > 0);
    setHighlightedCitations(null); // Clear highlights when new citations come in
  };

  const handleCitationClick = (citation: Citation) => {
    setHighlightedCitations(citation); // Highlight only the clicked citation
  };

  if (!fileName) {
    return (
      <>
        <VStack spacing={0} align="stretch" minH="100vh">
          <HeaderNav
            signOut={() => {}}
            onNewConversation={handleNewConversation}
          />
          <Container maxW="6xl" py={8}>
            <Text>No file specified</Text>
          </Container>
        </VStack>
        <Chat
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onCitationsUpdate={handleCitationsUpdate}
          onCitationClick={handleCitationClick}
        />
      </>
    );
  }

  return (
    <>
      <VStack spacing={0} align="stretch" minH="100vh">
        <HeaderNav
          signOut={() => {}}
          onNewConversation={handleNewConversation}
        />
        <Container maxW="4xl" py={8} transition="margin-right 0.3s">
          <HStack spacing={4} mb={6}>
            <Text fontSize="xl" fontWeight="bold">
              {fileName}
            </Text>
          </HStack>

          <Box
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            bg="gray.50"
            height="80vh"
          >
            <PdfViewer
              fileName={fileName}
              highlight={highlightedCitations || null}
            />
          </Box>
        </Container>
      </VStack>
      <Chat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        documentName={fileName}
        onCitationsUpdate={handleCitationsUpdate}
        onCitationClick={handleCitationClick}
      />
      {showCitations && (
        <CitationPanel
          citations={citations}
          onClose={() => setShowCitations(false)}
        />
      )}
    </>
  );
}
