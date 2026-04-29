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
  const [loading, setLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

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

  const isHelpRequestFormValid = () => {
    return selectedReason && selectedHelpType && helpDescription.length > 0;
  };

  const submitHelpRequest = async () => {
    if (!isHelpRequestFormValid()) return;

    setLoading(true);
    const data = {
      reason: selectedReason.value,
      type: selectedHelpType.value,
      description: helpDescription,
    };
    try {
      // call some request hook
      // await some request
      console.log('DATA...    ', data);
      // Call some alert hook
    } catch (error) {
      // handle errors
      // Call some alert hook
    } finally {
      // clean up
      // Mocked response
      setTimeout(() => {
        setLoading(false);
        console.log('Help request submitted successfully');
        setIsSubmitted(true);
      }, 5000);
    }
  };

  return {
    helpReasons,
    selectedReason,
    setSelectedReason,
    helpTypes,
    selectedHelpType,
    setSelectedHelpType,
    helpDescription,
    setHelpDescription,
    loading,
    submitHelpRequest,
    isSubmitted,
    setIsSubmitted,
  };
};

export default useSeekHelp;
