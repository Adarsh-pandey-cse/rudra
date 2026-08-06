import React from 'react';
import { Calculator, FlaskConical, BookOpen, Languages, Globe, Book, PenTool, Brain, Shapes, Type, Binary } from 'lucide-react';

export const SubjectIcon = ({ iconName, className }: { iconName: string, className?: string }) => {
  switch (iconName?.toLowerCase()) {
    case 'calculator':
    case 'math':
    case 'mathematics':
      return <Calculator className={className} />;
    case 'flask':
    case 'science':
    case 'flaskconical':
      return <FlaskConical className={className} />;
    case 'bookopen':
    case 'english':
    case 'literature':
      return <BookOpen className={className} />;
    case 'languages':
    case 'hindi':
      return <Languages className={className} />;
    case 'globe':
    case 'social':
    case 'history':
      return <Globe className={className} />;
    case 'book':
      return <Book className={className} />;
    case 'pentool':
    case 'art':
      return <PenTool className={className} />;
    case 'brain':
    case 'logic':
      return <Brain className={className} />;
    case 'shapes':
    case 'geometry':
      return <Shapes className={className} />;
    case 'type':
    case 'grammar':
      return <Type className={className} />;
    case 'binary':
    case 'computer':
    case 'coding':
      return <Binary className={className} />;
    default:
      return <Book className={className} />; // Fallback icon
  }
};
