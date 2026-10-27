<?php

class CategoryManager
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getAll(): array
    {
        $stmt = $this->pdo->query(
            "SELECT c.cat_id, c.cat_name,
                    (SELECT COUNT(*) FROM product WHERE prd_cat_id = c.cat_id AND prd_status = 'active') AS active_count
             FROM category c
             ORDER BY c.cat_name ASC"
        );
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create(string $name): array
    {
        $name = trim($name);
        if ($name === '') {
            return ['status' => 'error', 'message' => 'Nome obrigatório.'];
        }
        if (strlen($name) > 80) {
            return ['status' => 'error', 'message' => 'Nome demasiado longo (máx 80).'];
        }

        try {
            $this->pdo->prepare("INSERT INTO category (cat_name) VALUES (?)")->execute([$name]);
            return ['status' => 'success', 'id' => (int) $this->pdo->lastInsertId()];
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                return ['status' => 'error', 'message' => 'Já existe uma categoria com esse nome.'];
            }
            return ['status' => 'error', 'message' => 'Erro ao criar categoria.'];
        }
    }

    public function update(int $categoryId, string $name): array
    {
        $name = trim($name);
        if ($name === '') {
            return ['status' => 'error', 'message' => 'Nome obrigatório.'];
        }

        try {
            $stmt = $this->pdo->prepare("UPDATE category SET cat_name = ? WHERE cat_id = ?");
            $stmt->execute([$name, $categoryId]);

            if ($stmt->rowCount() === 0) {
                return ['status' => 'error', 'message' => 'Categoria não encontrada ou nome igual.'];
            }
            return ['status' => 'success', 'message' => 'Categoria atualizada.'];
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                return ['status' => 'error', 'message' => 'Já existe uma categoria com esse nome.'];
            }
            return ['status' => 'error', 'message' => 'Erro ao atualizar.'];
        }
    }

    public function delete(int $categoryId): array
    {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM product WHERE prd_cat_id = ?");
        $stmt->execute([$categoryId]);
        $count = (int) $stmt->fetchColumn();

        if ($count > 0) {
            return ['status' => 'error', 'message' => "Não podes apagar: há $count produtos nesta categoria."];
        }

        $stmt = $this->pdo->prepare("DELETE FROM category WHERE cat_id = ?");
        $stmt->execute([$categoryId]);

        if ($stmt->rowCount() === 0) {
            return ['status' => 'error', 'message' => 'Categoria não encontrada.'];
        }
        return ['status' => 'success', 'message' => 'Categoria apagada.'];
    }
}