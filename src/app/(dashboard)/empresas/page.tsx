'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { useEmpresas, useAuth } from '@/hooks';
import { Building2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function EmpresasPage() {
  const { user } = useAuth();
  const { empresas, listarEmpresas, isLoading } = useEmpresas();

  useEffect(() => {
    listarEmpresas();
  }, []);

  return (
    <>
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Empresas</h1>
          <p className="text-muted-foreground mt-1">
            Empresas e sócios pagadores
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">Carregando...</div>
            ) : empresas.length === 0 ? (
              <div className="p-8 text-center">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma empresa cadastrada</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Cadastre as empresas/sócios no banco de dados via SQL
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresas.map((empresa) => (
                    <TableRow key={empresa.id_empresa}>
                      <TableCell className="font-medium">{empresa.nome}</TableCell>
                      <TableCell>{empresa.cnpj}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
