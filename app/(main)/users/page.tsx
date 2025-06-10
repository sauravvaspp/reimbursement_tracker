'use client';

import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/users/UserTable";
import AddUserDialog from "@/components/users/AddUserDialog";
import { fetchUsers, fetchManagers,  updateUser } from "@/lib/users/action";
import { deleteUser } from "@/lib/users/deleteuser";
import { createUser } from "@/lib/users/createUser";

export default function Users() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: '',
    managerID: '',
    reimbursement_budget: 0
  });
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'ascending' | 'descending' } | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fetchData = async () => {
    try {
      const [usersData, managersData] = await Promise.all([
        fetchUsers(),
        fetchManagers()
      ]);
      setUsers(usersData);
      setFilteredUsers(usersData);
      setManagers(managersData);
    } catch (error: any) {
      console.error("Error fetching data:", error.message);
      alert(error.message);
    }
  };

  const handleSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      await createUser(form);
      await fetchData();
      resetForm();
      setIsDialogOpen(false);
      return { success: true };
    } catch (error: any) {
      console.error("Error:", error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };
  

  const handleEdit = async (userId: string, updatedUser: any) => {
    setLoading(true);
    try {
      await updateUser(userId, updatedUser);
      await fetchData();
    } catch (error: any) {
      console.error("Error updating user:", error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUser(userId);
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting user:", error.message);
      alert(error.message);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      role: '',
      managerID: '',
      reimbursement_budget: 0
    });
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term === '') {
      applyRoleFilter(users);
    } else {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(term.toLowerCase()) ||
        user.email.toLowerCase().includes(term.toLowerCase()) ||
        user.phone.toLowerCase().includes(term.toLowerCase()) ||
        user.address.toLowerCase().includes(term.toLowerCase()) ||
        user.role.toLowerCase().includes(term.toLowerCase()) ||
        (user.managerID && users.find(u => u.id === user.managerID)?.name.toLowerCase().includes(term.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  };

  const applyRoleFilter = (userList: any[]) => {
    if (!roleFilter) {
      setFilteredUsers(userList);
    } else {
      setFilteredUsers(userList.filter(user => user.role === roleFilter));
    }
  };

  const requestSort = (key: string) => {
    if (sortConfig?.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending'
      });
    } else {
      setSortConfig({ key, direction: 'ascending' });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyRoleFilter(users);
  }, [roleFilter, users]);

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl font-semibold mb-4">Users</h2>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:max-w-md"></div>
        <div className="ml-auto">
          <AddUserDialog
            form={form}
            setForm={setForm}
            managers={managers}
            loading={loading}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            isOpen={isDialogOpen}
            setIsOpen={setIsDialogOpen}
            resetForm={resetForm}
            filteredUsers={filteredUsers}
          />
        </div>
      </div>

      <UserTable
        users={users}
        filteredUsers={filteredUsers}
        searchTerm={searchTerm}
        sortConfig={sortConfig}
        roleFilter={roleFilter}
        onSearch={handleSearch}
        onSort={requestSort}
        onRoleFilter={setRoleFilter}
        onDelete={handleDelete}
        onEdit={handleEdit}
        managers={managers}
      />
    </div>
  );
}