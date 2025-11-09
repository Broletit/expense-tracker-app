import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const r = await fetch('/api/profile', { method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] }); 
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const r = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });  // 👈 avatar mới sẽ hiển thị
    },
  });
}
