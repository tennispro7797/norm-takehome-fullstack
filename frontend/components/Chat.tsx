'use client';

import {
  Box,
  VStack,
  HStack,
  Input,
  Textarea,
  Button,
  Text,
  IconButton,
  Flex,
  Avatar,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { MdClose, MdSend } from 'react-icons/md';
import { useState, useEffect, useRef } from 'react';
import { Citation } from '@/types';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'norm';
  timestamp: Date;
  citations?: Citation[];
}

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
  documentName?: string;
  onCitationsUpdate?: (citations: Citation[]) => void;
  onCitationClick?: (citation: Citation) => void;
}

export default function Chat({
  isOpen,
  onClose,
  documentName,
  onCitationsUpdate,
  onCitationClick,
}: ChatProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [query]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: query.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage.text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      const normMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text:
          data.response || 'I apologize, but I could not generate a response.',
        sender: 'norm',
        timestamp: new Date(),
        citations: data.citations || [],
      };

      setMessages((prev) => [...prev, normMessage]);

      // Update citations for the panel
      if (onCitationsUpdate && data.citations) {
        onCitationsUpdate(data.citations);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);

      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I encountered an error: ${errorMessage}`,
        sender: 'norm',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      right={0}
      bottom={0}
      width="400px"
      height="95vh"
      bg="white"
      borderLeft="1px"
      borderColor="gray.200"
      shadow="lg"
      zIndex={1000}
    >
      <VStack spacing={0} height="100%">
        {/* Header */}
        <HStack
          w="100%"
          p={4}
          borderBottom="1px"
          borderColor="gray.200"
          justify="space-between"
        >
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold">Chat</Text>
            {documentName && (
              <Text fontSize="sm" color="gray.600">
                About: {documentName}
              </Text>
            )}
          </VStack>
          <IconButton
            icon={<MdClose />}
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close chat"
          />
        </HStack>

        {/* Messages area */}
        <Box flex={1} w="100%" overflowY="auto">
          {messages.length === 0 ? (
            <Flex h="100%" align="center" justify="center" p={4}>
              <Text color="gray.500" textAlign="center">
                Ask questions about {documentName || 'the legal documents'}
                <Text color="gray.500" textAlign="center">
                  I'm Norm, your legal AI assistant!
                </Text>
              </Text>
            </Flex>
          ) : (
            <VStack spacing={4} p={4} align="stretch">
              {messages.map((message) => (
                <Flex
                  key={message.id}
                  direction={message.sender === 'user' ? 'row-reverse' : 'row'}
                  align="start"
                  gap={3}
                >
                  <Avatar
                    size="sm"
                    name={message.sender === 'user' ? 'User' : 'Norm'}
                    bg={message.sender === 'user' ? 'blue.500' : 'green.500'}
                    color="white"
                  />
                  <Box
                    bg={message.sender === 'user' ? 'blue.100' : 'gray.100'}
                    p={3}
                    borderRadius="lg"
                    maxW="80%"
                    borderBottomRightRadius={
                      message.sender === 'user' ? 'sm' : 'lg'
                    }
                    borderBottomLeftRadius={
                      message.sender === 'user' ? 'lg' : 'sm'
                    }
                  >
                    <Text fontSize="sm" whiteSpace="pre-wrap">
                      {message.text}
                    </Text>
                    {message.citations && message.citations.length > 0 && (
                      <Box mt={2} pt={2} borderTop="1px" borderColor="gray.300">
                        <Text fontSize="xs" fontWeight="bold" mb={1}>
                          Sources:
                        </Text>
                        {message.citations.map((citation, idx) => (
                          <Text
                            key={idx}
                            fontSize="xs"
                            color="blue.600"
                            cursor="pointer"
                            _hover={{ textDecoration: 'underline' }}
                            onClick={() => onCitationClick?.(citation)}
                          >
                            • {citation.source}:{' '}
                            {citation.text.substring(0, 80)}...
                          </Text>
                        ))}
                      </Box>
                    )}
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {message.timestamp.toLocaleTimeString()}
                    </Text>
                  </Box>
                </Flex>
              ))}
              {isLoading && (
                <Flex align="start" gap={3}>
                  <Avatar size="sm" name="Norm" bg="green.500" color="white" />
                  <Box
                    bg="gray.100"
                    p={3}
                    borderRadius="lg"
                    borderBottomLeftRadius="sm"
                  >
                    <HStack spacing={2}>
                      <Spinner size="sm" />
                      <Text fontSize="sm">Norm is thinking...</Text>
                    </HStack>
                  </Box>
                </Flex>
              )}
            </VStack>
          )}
        </Box>

        {/* Error display */}
        {error && (
          <Alert status="error" size="sm">
            <AlertIcon />
            <Text fontSize="sm">{error}</Text>
          </Alert>
        )}

        {/* Input area */}
        <HStack
          w="100%"
          p={4}
          borderTop="1px"
          borderColor="gray.200"
          align="flex-end"
        >
          <Textarea
            ref={textareaRef}
            placeholder={
              isLoading ? 'Norm is responding...' : 'Ask a question...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            flex={1}
            isDisabled={isLoading}
            minH="40px"
            maxH="120px"
            resize="none"
            rows={1}
            overflow="hidden"
            whiteSpace="pre-wrap"
            wordBreak="break-word"
          />
          <Button
            colorScheme="blue"
            onClick={handleSend}
            isDisabled={!query.trim() || isLoading}
            isLoading={isLoading}
            leftIcon={isLoading ? undefined : <MdSend />}
            size="sm"
            ml={2}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
