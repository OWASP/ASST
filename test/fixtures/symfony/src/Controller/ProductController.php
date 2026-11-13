<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class ProductController
{
    public function list(Request $request, Connection $conn): Response
    {
        $category = $request->query->get('category');
        $rows = $conn->executeQuery("SELECT * FROM product WHERE category = '$category'"); // @expect CWE-89
        $page = $request->query->getInt('page');
        $more = $conn->executeQuery('SELECT * FROM product LIMIT 10 OFFSET ' . ($page * 10));
        return new Response('<h1>' . $request->query->get('title') . '</h1>'); // @expect CWE-79
    }
}
