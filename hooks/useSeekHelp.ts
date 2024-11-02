import { useEffect, useState } from 'react';

import { HELP_SEEKING_REASONS, HELP_SEEKING_TYPES } from '@/constants/Data';
import { Record } from '@/lib/types';
import { parseArrayStringsToSelectableObjects } from '@/utils';

const useSeekHelp = () => {
  const [helpReasons, setHelpReasons] = useState<Record[] | null>(null);
  const [selectedReason, setSelectedReason] = useState<Record>({});
  const [helpTypes, setHelpTypes] = useState<Record[] | null>(null);
  const [selectedHelpType, setSelectedHelpType] = useState<Record>({});
  const [helpDescription, setHelpDescription] = useState<string>('');

  useEffect(() => {
    if (helpReasons) return;
    const reasons = parseArrayStringsToSelectableObjects(HELP_SEEKING_REASONS);
    setHelpReasons(reasons);
  }, []);

  useEffect(() => {
    if (helpTypes) return;
    const types = parseArrayStringsToSelectableObjects(HELP_SEEKING_TYPES);
    setHelpTypes(types);
  }, []);

  return {
    helpReasons,
    selectedReason,
    setSelectedReason,
    helpTypes,
    selectedHelpType,
    setSelectedHelpType,
    helpDescription,
    setHelpDescription,
  };
};

export default useSeekHelp;
