import mammoth from 'mammoth'

export async function extractTextFromDocx(file: File): Promise<string> {
  try {
    // For .docx files
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value.trim()
    }
    // For .doc files
    else if (file.type === 'application/msword') {
      // Note: Old .doc files require a different approach
      // You might want to show a message suggesting to save as .docx
      throw new Error('Legacy .doc files are not supported. Please save your document as .docx and try again.')
    }
    
    throw new Error('Unsupported file type')
  } catch (error) {
    console.error('Error extracting text from document:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to extract text from document file')
  }
} 