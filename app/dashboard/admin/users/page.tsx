import UserCrudPage from "./user-component";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'User page',
  description: 'Manage application users and roles.',
};

export default function UsersPage() {

  return (
    <>
      <UserCrudPage />
    </>
  );
}