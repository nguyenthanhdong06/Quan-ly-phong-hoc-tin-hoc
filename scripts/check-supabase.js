import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://teslhzdwnbhrreyyvybe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc2xoemR3bmJocnJleXl2eWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODU4MzMsImV4cCI6MjA5Njc2MTgzM30.7C_kMIAteGDhkljjK6lpbjIPHxZS_GWmVhzd6rJsjIY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectKeys() {
  console.log('\n🔍 CHI TIẾT DỮ LIỆU LỚP HỌC VÀ THÀNH VIÊN TRÊN SUPABASE:');

  const { data: classesData } = await supabase.from('school_states').select('*').eq('key', 'school_classes');
  const { data: membersData } = await supabase.from('school_states').select('*').eq('key', 'school_members');
  const { data: studentsData } = await supabase.from('school_states').select('*').eq('key', 'school_students');

  console.log('\n🏫 1. [school_classes] (Lớp học):');
  console.log(JSON.stringify(classesData?.[0]?.value, null, 2));

  console.log('\n👤 2. [school_members] (Tài khoản User / Thành viên):');
  console.log(JSON.stringify(membersData?.[0]?.value, null, 2));

  console.log('\n🎓 3. [school_students] (Học sinh): Total:', studentsData?.[0]?.value?.length);
}

inspectKeys();
