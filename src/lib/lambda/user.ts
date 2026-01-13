import { fetchLambda } from './_helper';

type ApiUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export async function fetchUsers(): Promise<ApiUser[]> {
  const response = await fetchLambda<{ users: ApiUser[] }>({
    path: 'admin/users',
    method: 'GET',
  });
  return response?.users ?? [];
}

export async function removeUser(userId: string): Promise<void> {
  await fetchLambda({
    path: `admin/users/${userId}`,
    method: 'DELETE',
  });
}

export async function addUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<void> {
  await fetchLambda({
    path: 'admin/users',
    method: 'POST',
    body: input,
  });
}
