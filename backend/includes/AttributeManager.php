<?php

class AttributeManager
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function add(int $productId, string $name, string $value): array
    {
        $name  = trim($name);
        $value = trim($value);

        if ($name === '' || $value === '') {
            return ['status' => 'error', 'message' => 'Nome e valor obrigatórios.'];
        }

        try {
            $this->pdo->prepare(
                "INSERT INTO product_attribute (atr_prd_id, atr_name, atr_value) VALUES (?, ?, ?)"
            )->execute([$productId, $name, $value]);

            return ['status' => 'success', 'id' => (int) $this->pdo->lastInsertId()];
        } catch (Exception $e) {
            return ['status' => 'error', 'message' => 'Erro ao adicionar atributo.'];
        }
    }

    public function addMultiple(int $productId, array $attributes): array
    {
        if (empty($attributes)) {
            return ['status' => 'error', 'message' => 'Sem atributos para adicionar.'];
        }

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                "INSERT INTO product_attribute (atr_prd_id, atr_name, atr_value) VALUES (?, ?, ?)"
            );

            $count = 0;
            foreach ($attributes as $attr) {
                $name  = trim($attr['name'] ?? '');
                $value = trim($attr['value'] ?? '');
                if ($name !== '' && $value !== '') {
                    $stmt->execute([$productId, $name, $value]);
                    $count++;
                }
            }

            $this->pdo->commit();
            return ['status' => 'success', 'inserted' => $count];
        } catch (Exception $e) {
            $this->pdo->rollBack();
            return ['status' => 'error', 'message' => 'Erro ao adicionar atributos.'];
        }
    }

    public function getForProduct(int $productId): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT atr_id, atr_name, atr_value FROM product_attribute WHERE atr_prd_id = ? ORDER BY atr_name"
        );
        $stmt->execute([$productId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function delete(int $attributeId): bool
    {
        return $this->pdo->prepare("DELETE FROM product_attribute WHERE atr_id = ?")
            ->execute([$attributeId]);
    }
}