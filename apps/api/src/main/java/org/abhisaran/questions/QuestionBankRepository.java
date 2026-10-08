package org.abhisaran.questions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionBankRepository extends JpaRepository<QuestionBank, String> {

    List<QuestionBank> findAllByOrderByDisplayOrderAsc();

    List<QuestionBank> findByDomainOrderByDisplayOrderAsc(String domain);

    List<QuestionBank> findBySectionOrderByDisplayOrderAsc(String section);

    List<QuestionBank> findByActiveTrueOrderByDisplayOrderAsc();
}
