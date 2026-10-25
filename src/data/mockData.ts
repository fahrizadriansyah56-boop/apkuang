import { CommitteeInfo, DivisionBudget, Transaction, CommitteeFee, Sponsorship, ReminderItem } from '../types/finance';

export const INITIAL_COMMITTEE_INFO: CommitteeInfo = {
  eventName: '',
  eventTheme: '',
  organization: '',
  budgetPeriod: '',
  eventDate: '',
  venue: '',
  chairpersonName: '',
  treasurerName: '',
  targetTotalBudget: 0,
};

export const INITIAL_DIVISIONS: DivisionBudget[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_COMMITTEE_FEES: CommitteeFee[] = [];

export const INITIAL_SPONSORSHIPS: Sponsorship[] = [];

export const INITIAL_REMINDERS: ReminderItem[] = [];

