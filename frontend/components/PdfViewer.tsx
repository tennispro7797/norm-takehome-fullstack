'use client';

import { useState, useEffect, useRef } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { Citation } from '@/types';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const options = {
  cMapUrl: '/cmaps/',
  standardFontDataUrl: '/standard_fonts/',
};

const maxWidth = 800;

type PdfViewerProps = {
  fileName: string;
  highlight: Citation | null;
};

export default function PdfViewer({ fileName, highlight }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const highlightedSections = useRef<Set<string>>(new Set());

  function onDocumentLoadSuccess({
    numPages: nextNumPages,
  }: PDFDocumentProxy): void {
    setNumPages(nextNumPages);
  }

  // Scroll to highlighted text when highlight changes
  useEffect(() => {
    if (highlight && numPages) {
      // Clear previous highlights when highlight changes
      highlightedSections.current.clear();

      // Wait for the pages to render
      const timer = setTimeout(() => {
        const highlightedElement = document.querySelector('mark');
        if (highlightedElement) {
          highlightedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 1000); // Give pages time to render

      return () => clearTimeout(timer);
    }
  }, [highlight, numPages]);

  // Custom text renderer for highlighting
  const customTextRenderer = ({ str }: { str: string }) => {
    if (!highlight) return str;

    let highlightedText = str;
    const color = 'yellow';

    // Extract section numbers from citation sources
    // Parse "6.3 (Thievery)" -> "6.3"
    const sectionMatch = highlight.source.match(/^(\d+\.?\d*)/);

    if (sectionMatch) {
      const section = sectionMatch[1];

      // Check if we've already highlighted this section
      if (!highlightedSections.current.has(section)) {
        // Look for this section number in the text
        const sectionRegex = new RegExp(
          `\\b${section.replace(/\./g, '\\.')}\\b`,
          'gi'
        );

        // Check if this text contains the section
        if (sectionRegex.test(highlightedText)) {
          // Mark this section as highlighted
          highlightedSections.current.add(section);

          // Replace the first occurrence
          highlightedText = highlightedText.replace(
            sectionRegex,
            (match) =>
              `<mark style="background-color: ${color}; padding: 1px 2px; border-radius: 2px; font-weight: bold;">${match}</mark>`
          );
        }
      }
    }

    return highlightedText;
  };

  return (
    <Box height="100%" width="100%">
      {Boolean(highlight) && (
        <Box p={2} bg="blue.50" borderRadius="md" mb={2}>
          <Text fontSize="sm" fontWeight="bold" color="blue.600">
            Highlighting citation in PDF
          </Text>
          <Text fontSize="xs" color="gray.600" mt={1}>
            Section: {highlight?.source}
          </Text>
        </Box>
      )}
      <Box height="100%" overflowY="auto">
        <Document
          file={`/api/docs/${fileName}`}
          onLoadSuccess={onDocumentLoadSuccess}
          options={options}
          loading={
            <VStack spacing={4} justify="center" height="60vh">
              <Spinner size="xl" />
              <Text>Loading PDF...</Text>
            </VStack>
          }
          error={
            <VStack spacing={4} justify="center" height="60vh">
              <Text color="red.500">Failed to load PDF</Text>
            </VStack>
          }
        >
          {Array.from(new Array(numPages), (_el, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={maxWidth}
              customTextRenderer={customTextRenderer}
            />
          ))}
        </Document>
      </Box>
    </Box>
  );
}
