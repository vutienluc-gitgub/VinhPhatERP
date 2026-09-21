import React from 'react';
import { Input, InputProps } from './Input';
import { Search } from 'lucide-react';

export function SearchInput(props: InputProps) {
  return <Input leftIcon={<Search size={16} />} placeholder="Tìm kiếm..." {...props} />;
}
