<?php

class TransactionManager
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function deposit(int $userId, float $amount, string $description = 'Depósito'): array
    {
        if ($amount <= 0) {
            return ['status' => 'error', 'message' => 'Valor inválido.'];
        }

        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("UPDATE userss SET usr_balance = usr_balance + ? WHERE usr_id = ?")
                ->execute([$amount, $userId]);

            $this->pdo->prepare(
                "INSERT INTO transactions (tra_usr_id, tra_type, tra_amount, tra_description) VALUES (?, 'deposit', ?, ?)"
            )->execute([$userId, $amount, $description]);

            $this->pdo->commit();
            return ['status' => 'success', 'message' => 'Depósito realizado.', 'amount' => $amount];
        } catch (Exception $e) {
            $this->pdo->rollBack();
            return ['status' => 'error', 'message' => 'Erro no depósito.'];
        }
    }

    public function getBalance(int $userId): float
    {
        $stmt = $this->pdo->prepare("SELECT usr_balance FROM userss WHERE usr_id = ?");
        $stmt->execute([$userId]);
        return (float) $stmt->fetchColumn();
    }

}