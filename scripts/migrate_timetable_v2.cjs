const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://teslhzdwnbhrreyyvybe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc2xoemR3bmJocnJleXl2eWJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExODU4MzMsImV4cCI6MjA5Njc2MTgzM30.7C_kMIAteGDhkljjK6lpbjIPHxZS_GWmVhzd6rJsjIY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function shiftSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') return schedule;
  
  // Kiểm tra xem đã có slot -8 chưa, nếu có slot -8 thì có thể đã migrate rồi
  const keys = Object.keys(schedule);
  const alreadyMigrated = keys.some(k => k.endsWith('-8'));
  if (alreadyMigrated) {
    console.log('   (Đã được migrate trước đó, bỏ qua)');
    return schedule;
  }

  const newSchedule = {};
  for (const [key, val] of Object.entries(schedule)) {
    const parts = key.split('-');
    if (parts.length === 2) {
      const day = parts[0];
      const period = parts[1];
      if (period === '7') {
        newSchedule[`${day}-8`] = val;
      } else if (period === '6') {
        newSchedule[`${day}-7`] = val;
      } else if (period === '5') {
        newSchedule[`${day}-6`] = val;
      } else {
        newSchedule[key] = val;
      }
    } else {
      newSchedule[key] = val;
    }
  }
  return newSchedule;
}

async function runMigration() {
  console.log('🚀 Bắt đầu di chuyển dữ liệu Thời khóa biểu trên Supabase...');
  
  // 1. Lấy tất cả records timetable trong school_states
  const { data, error } = await supabase
    .from('school_states')
    .select('*');

  if (error) {
    console.error('❌ Lỗi truy vấn Supabase:', error);
    return;
  }

  const timetableRows = data.filter(r => r.key === 'school_timetable_data' || (r.key.startsWith('ws_') && r.key.endsWith('_school_timetable_data')));
  console.log(`Tìm thấy ${timetableRows.length} bảng ghi thời khóa biểu:`, timetableRows.map(r => r.key));

  for (const row of timetableRows) {
    console.log(`\nĐang xử lý ${row.key}...`);
    let updatedVal;
    if (row.key === 'school_timetable_data') {
      updatedVal = {};
      for (const [teacherId, sched] of Object.entries(row.value || {})) {
        console.log(` - Giáo viên: ${teacherId}`);
        updatedVal[teacherId] = shiftSchedule(sched);
      }
    } else {
      updatedVal = shiftSchedule(row.value);
    }

    const { error: updateErr } = await supabase
      .from('school_states')
      .upsert({
        key: row.key,
        value: updatedVal,
        updated_at: new Date().toISOString()
      });

    if (updateErr) {
      console.error(`❌ Lỗi cập nhật ${row.key}:`, updateErr);
    } else {
      console.log(`✅ Cập nhật thành công ${row.key}!`);
    }
  }

  console.log('\n🎉 Hoàn thành migration thời khóa biểu trên Supabase!');
}

runMigration();
