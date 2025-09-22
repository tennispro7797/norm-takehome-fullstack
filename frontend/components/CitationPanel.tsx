'use client';

import {
  Box,
  VStack,
  Text,
  Badge,
  IconButton,
  Collapse,
} from '@chakra-ui/react';
import { MdClose, MdExpandMore, MdExpandLess } from 'react-icons/md';
import { useState } from 'react';
import { Citation } from '@/types';

interface CitationPanelProps {
  citations: Citation[];
  onClose: () => void;
}

export default function CitationPanel({
  citations,
  onClose,
}: CitationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (citations.length === 0) return null;

  return (
    <Box
      position="fixed"
      bottom="20px"
      left="20px"
      width="400px"
      bg="white"
      borderRadius="lg"
      shadow="2xl"
      border="1px"
      borderColor="gray.200"
      zIndex={999}
      maxHeight="60vh"
      overflow="hidden"
    >
      {/* Header */}
      <Box
        p={3}
        borderBottom="1px"
        borderColor="gray.200"
        bg="blue.50"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Badge colorScheme="blue">{citations.length}</Badge>
          <Text fontSize="sm" fontWeight="bold" color="blue.700">
            Referenced Section{citations.length > 1 ? 's' : ''}
          </Text>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            icon={isExpanded ? <MdExpandLess /> : <MdExpandMore />}
            size="sm"
            variant="ghost"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          />
          <IconButton
            icon={<MdClose />}
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
          />
        </Box>
      </Box>

      {/* Content */}
      <Collapse in={isExpanded}>
        <VStack
          spacing={3}
          p={3}
          align="stretch"
          maxHeight="400px"
          overflowY="auto"
        >
          {citations.map((citation, index) => (
            <Box
              key={index}
              p={3}
              bg="gray.50"
              borderRadius="md"
              borderLeft="4px"
              borderLeftColor={`${['blue', 'green', 'purple', 'orange', 'pink'][index % 5]}.400`}
            >
              <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                {citation.source}
              </Text>
              <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                Page Number: {citation.page_number}
              </Text>
              {citation.parent_section && (
                <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                  Parent Section: {citation.parent_section}
                </Text>
              )}
              <Text fontSize="sm" color="gray.700">
                "{citation.text}"
              </Text>
            </Box>
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
}
