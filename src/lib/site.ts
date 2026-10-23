export const site = {
  name: 'xechoz/android',
  repo: 'https://github.com/xechoz/android-kit',
  repoName: 'xechoz/android-kit',
  github: 'https://github.com/xechoz',
  blog: 'https://xechoz.github.io/',
  quickFileShare: 'https://xechoz.github.io/quick-file-share/',
  skillsInstall: 'npx skills add xechoz/android-kit',
  skillsSpec: 'https://agentskills.io',
} as const;

export const siteUrl = import.meta.env.SITE ?? 'https://xechoz.github.io';
