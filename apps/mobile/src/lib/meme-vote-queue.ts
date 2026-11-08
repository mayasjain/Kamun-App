import type { MemeActivity, MemeVote } from './meme-interactions';

export function withMemeVote(activity: MemeActivity, vote: MemeVote): MemeActivity {
 return {
  ...activity,
  my_vote: vote,
  upvotes: activity.upvotes - Number(activity.my_vote === 1) + Number(vote === 1),
  downvotes: activity.downvotes - Number(activity.my_vote === -1) + Number(vote === -1),
 };
}

/** Show each tap immediately; serialize writes and coalesce intermediate choices. */
export function createMemeVoteQueue(options: {
 current: () => MemeActivity | undefined;
 publish: (activity: MemeActivity) => void;
 save: (vote: MemeVote) => Promise<void>;
 onError: () => void;
}) {
 let running = false;
 let desired: MemeVote = 0;
 let confirmed: MemeVote = 0;
 async function flush() {
  try {
   while (desired !== confirmed) {
    const sent = desired;
    try {
     await options.save(sent);
     confirmed = sent;
    } catch {
     // A newer tap may still succeed. Only roll back a failed final choice.
     if (desired === sent) {
      desired = confirmed;
      const current = options.current();
      if (current) options.publish(withMemeVote(current, confirmed));
      options.onError();
     }
    }
   }
  } finally { running = false; }
 }
 return {
  get pending() { return running; },
  toggle(value: -1 | 1) {
   const current = options.current();
   if (!current) return;
   if (!running) confirmed = current.my_vote;
   desired = current.my_vote === value ? 0 : value;
   options.publish(withMemeVote(current, desired));
   if (!running) { running = true; void flush(); }
  },
 };
}
