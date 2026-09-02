export interface StudentAvatarData {
  emoji: string;
  bg: string;
}

export const ANIMAL_AVATARS: StudentAvatarData[] = [
  { emoji: "🐼", bg: "bg-indigo-50 border-indigo-100" },
  { emoji: "🐰", bg: "bg-emerald-50 border-emerald-100" },
  { emoji: "🦁", bg: "bg-amber-50 border-amber-100" },
  { emoji: "🦊", bg: "bg-orange-50 border-orange-100" },
  { emoji: "🐯", bg: "bg-yellow-50 border-yellow-100" },
  { emoji: "🐨", bg: "bg-slate-100/80 border-slate-200" },
  { emoji: "🐸", bg: "bg-green-50 border-green-100" },
  { emoji: "🐷", bg: "bg-pink-50 border-pink-100" },
  { emoji: "🐻", bg: "bg-amber-100/60 border-amber-200" },
  { emoji: "🦉", bg: "bg-purple-50 border-purple-100" },
  { emoji: "🐱", bg: "bg-rose-50 border-rose-100" },
  { emoji: "🐶", bg: "bg-blue-50 border-blue-100" },
  { emoji: "🐧", bg: "bg-slate-100/80 border-slate-200" },
  { emoji: "🐻‍❄️", bg: "bg-rose-50 border-rose-200" },
  { emoji: "🦄", bg: "bg-rose-50 border-rose-100" },
  { emoji: "🐺", bg: "bg-slate-100/80 border-slate-200" },
  { emoji: "🦝", bg: "bg-slate-100/80 border-slate-200" },
  { emoji: "🐹", bg: "bg-rose-50 border-rose-100" },
  { emoji: "🐭", bg: "bg-emerald-50 border-emerald-100" },
  { emoji: "🐮", bg: "bg-emerald-50 border-emerald-100" },
  { emoji: "🐴", bg: "bg-amber-100/60 border-amber-200" },
  { emoji: "🐳", bg: "bg-blue-50 border-blue-100" },
  { emoji: "🐋", bg: "bg-blue-50 border-blue-100" },
  { emoji: "🐙", bg: "bg-pink-50 border-pink-100" },
  { emoji: "🦑", bg: "bg-amber-100/60 border-orange-100" },
  { emoji: "🦀", bg: "bg-amber-100/60 border-pink-100" },
  { emoji: "🦚", bg: "bg-green-50 border-green-100" },
  { emoji: "🦧", bg: "bg-blue-50 border-blue-100" },
  { emoji: "🕊️", bg: "bg-emerald-50 border-emerald-100" },
  { emoji: "🐞", bg: "bg-amber-50 border-amber-100" },
  { emoji: "🦋", bg: "bg-amber-50 border-amber-100" },
  { emoji: "🐝", bg: "bg-yellow-50 border-yellow-100" },
  { emoji: "🦗", bg: "bg-amber-50 border-amber-100" },
  { emoji: "🪲", bg: "bg-green-50 border-green-100" },
  { emoji: "🪰", bg: "bg-emerald-50 border-emerald-100" },
  { emoji: "🕷️", bg: "bg-emerald-50 border-emerald-100" },
  { emoji: "🦂", bg: "bg-emerald-50 border-emerald-100" },
  { emoji: "🦖", bg: "bg-emerald-50 border-emerald-100" },
  { emoji: "🦕", bg: "bg-emerald-50 border-emerald-100" },
  { emoji: "🐲", bg: "bg-blue-50 border-blue-100" },
  { emoji: "🐔", bg: "bg-emerald-50 border-emerald-100" },
  { emoji: "🐓", bg: "bg-emerald-50 border-emerald-100" }
];

export function getStudentAvatar(studentIdOrName: string, allStudents?: { id: string }[]): StudentAvatarData {
  if (!studentIdOrName) return ANIMAL_AVATARS[0];

  if (allStudents && allStudents.length > 0) {
    const sorted = [...allStudents].sort((a, b) => a.id.localeCompare(b.id));
    const index = sorted.findIndex(s => s.id === studentIdOrName);
    if (index !== -1) {
      return ANIMAL_AVATARS[index % ANIMAL_AVATARS.length];
    }
  }

  let hash = 0;
  for (let i = 0; i < studentIdOrName.length; i++) {
    hash = studentIdOrName.charCodeAt(i) + ((hash << 20) - hash);
  }
  hash = Math.abs(hash);

  return ANIMAL_AVATARS[hash % ANIMAL_AVATARS.length];
}
