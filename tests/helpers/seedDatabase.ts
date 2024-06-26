import { faker } from "@faker-js/faker";
import {PendingProposal, ProposalResponse} from "../../types/proposal";
import ProposalService from "../../services/proposals";
import VoteService from "../../services/vote";

export type User = {
  firstName: string;
  lastName: string;
  email: string;
  displayName: string;
};

export function createUsers(n: number): User[] {
  const activeUsers = Array.from({ length: n }, () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });

    return { firstName, lastName, email, displayName: faker.internet.userName({ firstName }) };
  });

  return activeUsers;
}

type SeedOptions = {
  numUsers?: number;
  numAuthors?: number;
  seed?: number;
};

export function seedDatabase({ numUsers = 50, numAuthors = 5, seed = 1 }: SeedOptions = {}) {
  faker.seed(seed);

  const users = createUsers(numUsers);
  const authors = createUsers(numAuthors);

  /****************************************
   * PROPOSALS
   ****************************************/
  async function addProposals(numProposals: number = 1) {
    const proposals: ProposalResponse[] = [];

    for (let i = 0; i < numProposals; i += 1) {
      const newProposal = await PendingProposal.parseAsync(ProposalService.factory());

      const author = faker.helpers.arrayElement(authors);

      const proposal = await ProposalService.store({
        data: newProposal,
        author: author.displayName,
        email: author.email
      });

      proposals.push(proposal);
    }

    return proposals;
  }

  /****************************************
   * VOTES
   ****************************************/
  async function addVotesForProposal(
    proposalId: number,
    numVotes: number | { min?: number, max?: number } = { min: 0, max: 10 }
  ) {
    const totalVotes = faker.number.int(numVotes);
    const shuffledUsers = faker.helpers.shuffle(users)

    for (let i = 0; i < totalVotes; i += 1) {
      const email = shuffledUsers[i].email;

      await VoteService.store({
        data: VoteService.factory(),
        recordId: proposalId,
        email
      })
    }
  }

  async function addUserVote(proposalId: number, userEmail?: string, value: number = 1) {
    userEmail = userEmail || (faker.helpers.arrayElement(users)).email;

    await VoteService.store({
      data: VoteService.factory({value: value}),
      recordId: proposalId,
      email: userEmail
    })
  }

  return {
    addProposals,
    addVotesForProposal,
    addUserVote,
    users,
    authors,
  };
}
